// app/routes/avatar.tsx
import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUserId } from "~/utils/auth.server";
import { uploadAvatar } from "~/utils/s3.server";
import { prisma } from "~/utils/prisma.server";

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const imageUrl = await uploadAvatar(request);

  if (!imageUrl) {
    return;
  }

  //  TODO : check prisma schema
  await prisma.user.update({
    data: {
      profile: {
        update: {
          profilePicture: imageUrl.toString(),
        },
      },
    },
    where: {
      id: userId,
    },
  });

  return json({ imageUrl });
};
