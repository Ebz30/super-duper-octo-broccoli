import { supabaseAdmin } from './supabase'
import { validateContent } from './profanity'

export interface ModerationResult {
  approved: boolean
  warnings: string[]
  errors: string[]
  action?: 'warn' | 'ban' | 'delete'
}

export interface ReportData {
  report_type: 'scam' | 'inappropriate_content' | 'fake_listing' | 'spam' | 'safety_concern' | 'other'
  reported_item_id?: string
  reported_user_id?: string
  description: string
  evidence_urls?: string[]
}

export class ModerationService {
  // Moderate content (items, messages, etc.)
  static async moderateContent(content: {
    title?: string
    description?: string
    notes?: string
  }): Promise<ModerationResult> {
    const validation = validateContent(content)
    
    if (!validation.isValid) {
      return {
        approved: false,
        warnings: validation.warnings,
        errors: validation.errors,
        action: 'warn'
      }
    }

    if (validation.warnings.length > 0) {
      return {
        approved: true,
        warnings: validation.warnings,
        errors: [],
        action: 'warn'
      }
    }

    return {
      approved: true,
      warnings: [],
      errors: []
    }
  }

  // Issue warning to user
  static async issueWarning(
    userId: string, 
    reason: string,
    details?: string
  ): Promise<{ success: boolean; warningCount: number; banned?: boolean }> {
    try {
      // Increment warning count
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update({ 
          warning_count: supabaseAdmin.rpc('increment_warning_count', { user_id: userId })
        })
        .eq('id', userId)
        .select('warning_count, email, name')
        .single()

      if (error) {
        console.error('Issue warning error:', error)
        return { success: false, warningCount: 0 }
      }

      const warningCount = user.warning_count + 1

      // Ban user if 3+ warnings
      if (warningCount >= 3) {
        await this.banUser(userId, `Automatic ban after ${warningCount} warnings`)
        return { success: true, warningCount, banned: true }
      }

      // TODO: Send warning email
      // await this.sendWarningEmail(user.email, user.name, warningCount, reason, details)

      return { success: true, warningCount }
    } catch (error) {
      console.error('Issue warning error:', error)
      return { success: false, warningCount: 0 }
    }
  }

  // Ban user
  static async banUser(userId: string, reason: string): Promise<{ success: boolean }> {
    try {
      // Update user as banned
      const { error: userError } = await supabaseAdmin
        .from('users')
        .update({
          is_banned: true,
          ban_reason: reason,
          banned_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (userError) {
        console.error('Ban user error:', userError)
        return { success: false }
      }

      // Deactivate all their listings
      const { error: itemsError } = await supabaseAdmin
        .from('items')
        .update({ is_available: false })
        .eq('seller_id', userId)

      if (itemsError) {
        console.error('Deactivate items error:', itemsError)
      }

      // Delete all active sessions
      const { error: sessionsError } = await supabaseAdmin
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)

      if (sessionsError) {
        console.error('Delete sessions error:', sessionsError)
      }

      // TODO: Send ban notification email
      // await this.sendBanEmail(userId, reason)

      return { success: true }
    } catch (error) {
      console.error('Ban user error:', error)
      return { success: false }
    }
  }

  // Submit report
  static async submitReport(
    reporterId: string,
    reportData: ReportData
  ): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {
      // Validate report data
      if (!reportData.report_type || !reportData.description) {
        return { success: false, error: 'Report type and description are required' }
      }

      if (reportData.description.length < 10) {
        return { success: false, error: 'Description must be at least 10 characters' }
      }

      if (reportData.reported_user_id === reporterId) {
        return { success: false, error: 'Cannot report yourself' }
      }

      // Insert report
      const { data: report, error } = await supabaseAdmin
        .from('reports')
        .insert({
          reporter_id: reporterId,
          report_type: reportData.report_type,
          reported_item_id: reportData.reported_item_id,
          reported_user_id: reportData.reported_user_id,
          description: reportData.description,
          evidence_urls: reportData.evidence_urls || [],
          status: 'pending',
        })
        .select('id')
        .single()

      if (error) {
        console.error('Submit report error:', error)
        return { success: false, error: 'Failed to submit report' }
      }

      // Auto-action for certain report types
      if (reportData.report_type === 'inappropriate_content' && reportData.reported_user_id) {
        await this.issueWarning(
          reportData.reported_user_id,
          'reported_inappropriate_content',
          reportData.description
        )
      }

      // TODO: Notify admin
      // await this.notifyAdmin('new_report', report)

      return { success: true, reportId: report.id }
    } catch (error) {
      console.error('Submit report error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Get user's reports
  static async getUserReports(userId: string): Promise<{
    success: boolean
    reports?: any[]
    error?: string
  }> {
    try {
      const { data: reports, error } = await supabaseAdmin
        .from('reports')
        .select(`
          id,
          report_type,
          status,
          created_at,
          resolved_at,
          admin_notes,
          reported_item:items(id, title),
          reported_user:users(id, name)
        `)
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get user reports error:', error)
        return { success: false, error: 'Failed to fetch reports' }
      }

      return { success: true, reports: reports || [] }
    } catch (error) {
      console.error('Get user reports error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Check if user is banned
  static async isUserBanned(userId: string): Promise<boolean> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('is_banned')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Check ban status error:', error)
        return false
      }

      return user?.is_banned || false
    } catch (error) {
      console.error('Check ban status error:', error)
      return false
    }
  }

  // Get user warning count
  static async getUserWarningCount(userId: string): Promise<number> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('warning_count')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Get warning count error:', error)
        return 0
      }

      return user?.warning_count || 0
    } catch (error) {
      console.error('Get warning count error:', error)
      return 0
    }
  }

  // Clean up old reports (utility function)
  static async cleanupOldReports(): Promise<void> {
    try {
      // Delete resolved reports older than 1 year
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      await supabaseAdmin
        .from('reports')
        .delete()
        .in('status', ['resolved', 'dismissed'])
        .lt('created_at', oneYearAgo.toISOString())
    } catch (error) {
      console.error('Cleanup old reports error:', error)
    }
  }

  // Validate image content (placeholder for future AI integration)
  static async validateImageContent(imageUrl: string): Promise<{
    approved: boolean
    confidence: number
    flags: string[]
  }> {
    // Placeholder for image content validation
    // In production, integrate with services like:
    // - AWS Rekognition
    // - Google Vision API
    // - Microsoft Azure Computer Vision
    
    return {
      approved: true,
      confidence: 0.95,
      flags: []
    }
  }

  // Rate limiting for reports (prevent spam)
  static async checkReportRateLimit(userId: string): Promise<{
    allowed: boolean
    remainingReports: number
    resetTime: Date
  }> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      
      const { count, error } = await supabaseAdmin
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('reporter_id', userId)
        .gte('created_at', oneHourAgo.toISOString())

      if (error) {
        console.error('Check rate limit error:', error)
        return { allowed: true, remainingReports: 5, resetTime: new Date() }
      }

      const reportsInLastHour = count || 0
      const maxReportsPerHour = 5
      const remaining = Math.max(0, maxReportsPerHour - reportsInLastHour)
      
      const resetTime = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

      return {
        allowed: reportsInLastHour < maxReportsPerHour,
        remainingReports: remaining,
        resetTime
      }
    } catch (error) {
      console.error('Check rate limit error:', error)
      return { allowed: true, remainingReports: 5, resetTime: new Date() }
    }
  }
}