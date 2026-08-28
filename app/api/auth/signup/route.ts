import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { ApiError, toErrorResponse } from '@/lib/errors/api-error';

const signupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const body = signupSchema.parse(await request.json());
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError('CONFLICT', 'An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: { name: body.name, email, passwordHash },
      select: { id: true, name: true, email: true, subscriptionTier: true, createdAt: true },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    // Expected error paths (email conflict, bad input) keep the normal
    // safe response shape.
    if (error instanceof ApiError || error instanceof ZodError) {
      return toErrorResponse(error);
    }

    // TEMPORARY DIAGNOSTIC — remove once the real production error is
    // identified. Exposes the raw error (message + stack + any extra
    // properties, e.g. Prisma's `code`/`meta`) directly in the response so
    // it's visible without needing Vercel Runtime Log access. This is a
    // real security regression while it's in place — anyone who can hit
    // this endpoint sees internal error detail, and a Prisma connection
    // string parse failure can echo the connection string (credentials
    // included) into `error.message`. Revert to `return toErrorResponse(error)`
    // as soon as the cause is confirmed from this output.
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error),
      },
      { status: 500 },
    );
  }
}
