import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    publishDate: z.coerce.date(),
    updateDate: z.coerce.date().optional(),
    category: z.string(),
    tags: z.array(z.string()),
    author: z.string().default('HOKAN STATION編集部'),
    featured: z.boolean().default(false),
    image: z.string().optional(),
  }),
});

export const collections = { blog };
