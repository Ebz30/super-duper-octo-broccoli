import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';
import { issueWarning } from '@/lib/content-moderation';
import { REPORT_TYPES } from '@/lib/types';

// GET /api/reports - Get user's reports
export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { data: reports, error, count } = await supabaseAdmin
      .from('reports')
      .select(`
        id,
        report_type,
        reported_item_id,
        reported_user_id,
        description,
        evidence_urls,
        status,
        admin_notes,
        created_at,
        resolved_at,
        reported_item:items(id, title, seller_id),
        reported_user:users(id, name)
      `, { count: 'exact' })
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: reports || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
        has_more: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Submit a new report
export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      report_type, 
      reported_item_id, 
      reported_user_id, 
      description, 
      evidence_urls 
    } = body;

    // Validate required fields
    if (!report_type || !description) {
      return NextResponse.json(
        { success: false, error: 'Report type and description are required' },
        { status: 400 }
      );
    }

    // Validate report type
    if (!REPORT_TYPES.includes(report_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report type' },
        { status: 400 }
      );
    }

    // Validate description length
    if (description.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Description must be less than 1000 characters' },
        { status: 400 }
      );
    }

    // Validate that user is not reporting themselves
    if (reported_user_id === user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot report yourself' },
        { status: 400 }
      );
    }

    // Validate that either item or user is reported
    if (!reported_item_id && !reported_user_id) {
      return NextResponse.json(
        { success: false, error: 'Must report either an item or a user' },
        { status: 400 }
      );
    }

    // If reporting an item, validate it exists
    if (reported_item_id) {
      const { data: item } = await supabaseAdmin
        .from('items')
        .select('id, seller_id')
        .eq('id', reported_item_id)
        .eq('deleted_at', null)
        .single();

      if (!item) {
        return NextResponse.json(
          { success: false, error: 'Item not found' },
          { status: 404 }
        );
      }

      // If no user specified, report the seller
      if (!reported_user_id) {
        body.reported_user_id = item.seller_id;
      }
    }

    // If reporting a user, validate they exist
    if (reported_user_id) {
      const { data: reportedUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', reported_user_id)
        .single();

      if (!reportedUser) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
    }

    // Create report
    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .insert({
        reporter_id: user.id,
        report_type,
        reported_item_id: reported_item_id || null,
        reported_user_id: reported_user_id || null,
        description: description.trim(),
        evidence_urls: evidence_urls || [],
        status: 'pending',
      })
      .select(`
        id,
        report_type,
        reported_item_id,
        reported_user_id,
        description,
        evidence_urls,
        status,
        created_at,
        reported_item:items(id, title),
        reported_user:users(id, name)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Auto-action for certain report types
    if (report_type === 'inappropriate_content' && reported_user_id) {
      await issueWarning(reported_user_id, 'reported_content', supabaseAdmin);
    }

    // TODO: Send notification to admin
    // await notifyAdmin('new_report', report);

    return NextResponse.json({
      success: true,
      data: report,
      message: 'Report submitted successfully',
    });
  } catch (error) {
    console.error('Submit report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}