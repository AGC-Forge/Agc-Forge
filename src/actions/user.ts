"use server";

import { prisma } from "@/lib/prisma";
import type { User, Role } from "@/prisma/client";
import { revalidatePath } from "next/cache";
