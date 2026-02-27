import { z } from 'zod';
import { products, priceHistory, trackProductSchema, trackMultipleProductsSchema, type ProductWithHistory } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      responses: {
        200: z.array(z.custom<ProductWithHistory>()),
        401: errorSchemas.internal,
      },
    },
    track: {
      method: 'POST' as const,
      path: '/api/products/track' as const,
      input: trackProductSchema,
      responses: {
        201: z.custom<ProductWithHistory>(),
        400: errorSchemas.validation,
        401: errorSchemas.internal,
      },
    },
    trackMultiple: {
      method: 'POST' as const,
      path: '/api/products/track-multiple' as const,
      input: trackMultipleProductsSchema,
      responses: {
        201: z.array(z.custom<ProductWithHistory>()),
        400: errorSchemas.validation,
        401: errorSchemas.internal,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/products/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.internal,
        404: errorSchemas.notFound,
      },
    },
    toggleActive: {
      method: 'PATCH' as const,
      path: '/api/products/:id/toggle-active' as const,
      input: z.object({ isActive: z.boolean() }),
      responses: {
        200: z.custom<ProductWithHistory>(),
        401: errorSchemas.internal,
        404: errorSchemas.notFound,
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
