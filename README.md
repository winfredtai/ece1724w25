# Karavideo

## Getting Started

### Development

1. Use pnpm version 10
2. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Generate supabase types.

1. Login to supabase: `pnpm exec supabase login`
2. Use `pnpm generate-types` to generate types in `src/types/supabase.ts`

### Build in local

```bash
pnpm build

pnpm start
```

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details..
