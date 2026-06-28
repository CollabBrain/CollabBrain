import prisma from "../../config/prisma";
import { DocumentType } from "@prisma/client";

export interface AdminDocumentQueryOptions {
  search?: string;
  isEmbedded?: boolean;
  type?: DocumentType;
  uploadedBy?: string;
  groupId?: string;
}

export const findDocumentsAdmin = async (
  page: number,
  limit: number,
  options?: AdminDocumentQueryOptions
) => {
  const skip = (page - 1) * limit;

  const where: any = {
    isDeleted: false,
  };

  if (options?.search) {
    where.name = { contains: options.search, mode: "insensitive" };
  }

  if (options?.isEmbedded !== undefined) {
    where.isEmbedded = options.isEmbedded;
  }

  if (options?.type) {
    where.type = options.type;
  }

  if (options?.uploadedBy) {
    where.uploadedBy = options.uploadedBy;
  }

  if (options?.groupId) {
    where.groupId = options.groupId;
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.document.count({ where })
  ]);

  return { documents, total };
};

export const deleteDocumentAdmin = async (id: string) => {
  return prisma.document.delete({
    where: { id }
  });
};
