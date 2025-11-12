'use client';

import { useForm } from 'react-hook-form';
import { ShippingAddress } from '@/lib/types/cart';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface ShippingFormProps {
  onSubmit: (data: ShippingAddress) => void;
  initialData?: Partial<ShippingAddress>;
  isLoading?: boolean;
}

// Common countries for dropdown
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  // Add more countries as needed
];

export default function ShippingForm({ onSubmit, initialData, isLoading }: ShippingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingAddress>({
    defaultValues: {
      full_name: initialData?.full_name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address_line1: initialData?.address_line1 || '',
      address_line2: initialData?.address_line2 || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      postal_code: initialData?.postal_code || '',
      country: initialData?.country || 'US',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Contact Information</h3>
        <div className="space-y-4">
          <Input
            label="Full Name"
            {...register('full_name', {
              required: 'Full name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters',
              },
            })}
            error={errors.full_name?.message}
            placeholder="John Doe"
            autoComplete="name"
          />

          <Input
            label="Email Address"
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address',
              },
            })}
            error={errors.email?.message}
            placeholder="john@example.com"
            autoComplete="email"
          />

          <Input
            label="Phone Number"
            type="tel"
            {...register('phone', {
              required: 'Phone number is required',
              pattern: {
                value: /^[\d\s\-\+\(\)]+$/,
                message: 'Please enter a valid phone number',
              },
            })}
            error={errors.phone?.message}
            placeholder="+1 (555) 123-4567"
            autoComplete="tel"
          />
        </div>
      </div>

      {/* Shipping Address */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Shipping Address</h3>
        <div className="space-y-4">
          <Input
            label="Address Line 1"
            {...register('address_line1', {
              required: 'Address is required',
              minLength: {
                value: 5,
                message: 'Address must be at least 5 characters',
              },
            })}
            error={errors.address_line1?.message}
            placeholder="123 Main Street"
            autoComplete="address-line1"
          />

          <Input
            label="Address Line 2 (Optional)"
            {...register('address_line2')}
            error={errors.address_line2?.message}
            placeholder="Apartment, suite, unit, etc."
            autoComplete="address-line2"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="City"
              {...register('city', {
                required: 'City is required',
                minLength: {
                  value: 2,
                  message: 'City must be at least 2 characters',
                },
              })}
              error={errors.city?.message}
              placeholder="San Francisco"
              autoComplete="address-level2"
            />

            <Input
              label="State/Region"
              {...register('state', {
                required: 'State/Region is required',
              })}
              error={errors.state?.message}
              placeholder="CA"
              autoComplete="address-level1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Postal Code"
              {...register('postal_code', {
                required: 'Postal code is required',
              })}
              error={errors.postal_code?.message}
              placeholder="94102"
              autoComplete="postal-code"
            />

            <div className="w-full">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Country
              </label>
              <select
                {...register('country', {
                  required: 'Country is required',
                })}
                className="flex h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200"
                autoComplete="country"
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {errors.country.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Continue to Confirmation
        </Button>
      </div>
    </form>
  );
}

