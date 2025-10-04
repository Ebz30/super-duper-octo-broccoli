import React from 'react';
import { useRoute, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, X } from 'lucide-react';
import apiService from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const editListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(50, 'Description must be at least 50 characters').max(1000),
  categoryId: z.string().min(1, 'Please select a category'),
  price: z.number().min(0, 'Price must be positive').max(999999.99),
  discountPercentage: z.number().min(0).max(100).optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  location: z.string().min(2).max(100),
});

type EditListingForm = z.infer<typeof editListingSchema>;

export default function EditListing() {
  const [, params] = useRoute('/items/:id/edit');
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newImages, setNewImages] = React.useState<File[]>([]);
  const [newPreviewUrls, setNewPreviewUrls] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch item details
  const { data: item, isLoading } = useQuery({
    queryKey: ['item', params?.id],
    queryFn: async () => {
      const response = await apiService.items.getById(params!.id);
      return response.data.item;
    },
    enabled: !!params?.id,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiService.categories.getAll();
      return response.data.categories;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<EditListingForm>({
    resolver: zodResolver(editListingSchema),
  });

  // Reset form when item loads
  React.useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        description: item.description,
        categoryId: item.categoryId,
        price: item.price,
        discountPercentage: item.discountPercentage || undefined,
        condition: item.condition,
        location: item.location,
      });
    }
  }, [item, reset]);

  // Handle new image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (newImages.length + files.length > 5) {
      toast({
        variant: 'destructive',
        title: 'Too many images',
        description: 'You can upload a maximum of 5 images',
      });
      return;
    }

    setNewImages(prev => [...prev, ...files]);

    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: EditListingForm) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      // Append form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Append new images if any
      newImages.forEach(image => {
        formData.append('images', image);
      });

      await apiService.items.update(params!.id, formData);

      toast({
        variant: 'success',
        title: 'Listing updated!',
        description: 'Your item has been updated successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', params?.id] });
      navigate(`/items/${params!.id}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update listing',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Item not found</p>
          <Button onClick={() => navigate('/my-listings')}>Back to My Listings</Button>
        </div>
      </div>
    );
  }

  const price = watch('price');
  const discount = watch('discountPercentage');
  const finalPrice = discount ? price * (1 - discount / 100) : price;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Listing</h1>
          <p className="text-gray-600">Update your item information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            <CardDescription>Make changes to your listing</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Current Images */}
              {item.images && item.images.length > 0 && (
                <div>
                  <Label>Current Images</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {item.images.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img src={image} alt={`Current ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Upload */}
              <div>
                <Label>Add New Images (optional)</Label>
                <div className="mt-2">
                  {newPreviewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {newPreviewUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img src={url} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {newImages.length < 5 && (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-teal-500 transition-colors">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to add new images</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="categoryId">Category *</Label>
                <select
                  id="categoryId"
                  {...register('categoryId')}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="">Select a category</option>
                  {categoriesData?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-sm text-red-500 mt-1">{errors.categoryId.message}</p>
                )}
              </div>

              {/* Price & Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (₺) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="discountPercentage">Discount (%)</Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    {...register('discountPercentage', { valueAsNumber: true })}
                  />
                  {errors.discountPercentage && (
                    <p className="text-sm text-red-500 mt-1">{errors.discountPercentage.message}</p>
                  )}
                </div>
              </div>

              {/* Final Price Preview */}
              {price && discount && discount > 0 && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                  <p className="text-sm text-teal-800">
                    Final price: <span className="font-bold text-lg">₺{finalPrice.toFixed(2)}</span>
                    {' '}
                    <span className="line-through text-gray-500">₺{price.toFixed(2)}</span>
                  </p>
                </div>
              )}

              {/* Condition */}
              <div>
                <Label htmlFor="condition">Condition *</Label>
                <select
                  id="condition"
                  {...register('condition')}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="">Select condition</option>
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
                {errors.condition && (
                  <p className="text-sm text-red-500 mt-1">{errors.condition.message}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  {...register('location')}
                />
                {errors.location && (
                  <p className="text-sm text-red-500 mt-1">{errors.location.message}</p>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Updating...' : 'Update Listing'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/items/${params!.id}`)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
