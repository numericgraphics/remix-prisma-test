// Follow --> https://github.com/remix-run/examples/blob/main/file-and-s3-upload/app/utils/s3.server.ts
import type {
    UploadHandler} from "@remix-run/node";
import {
    writeAsyncIterableToWritable,
    unstable_parseMultipartFormData,
    unstable_createMemoryUploadHandler,
    unstable_composeUploadHandlers
  } from "@remix-run/node";
  import S3 from "aws-sdk/clients/s3";
  import { PassThrough } from "stream";
  
  // 1
  const s3 = new S3({
    region: process.env.KUDOS_BUCKET_REGION,
    accessKeyId: process.env.KUDOS_ACCESS_KEY_ID,
    secretAccessKey: process.env.KUDOS_SECRET_ACCESS_KEY,
  });

  const uploadStream = ({ Key }: Pick<S3.Types.PutObjectRequest, "Key">) => {

    const pass = new PassThrough();
    return {
      writeStream: pass,
      promise: s3.upload({ Bucket: process.env.KUDOS_BUCKET_NAME || "", Key, Body: pass }).promise(),
    };
  };
  
  export async function uploadStreamToS3(data: any, filename: string) {
    const stream = uploadStream({
      Key: filename,
    });
    await writeAsyncIterableToWritable(data, stream.writeStream);
    const file = await stream.promise;
    return file.Location;
  }
  


  export async function uploadAvatar(request: Request) {

    const s3UploadHandler: UploadHandler = async ({
        name,
        filename,
        data,
      }) => {
        if (name !== "profile-pic") {
          return undefined;
        }
        const uploadedFileLocation = await uploadStreamToS3(data, filename!);
        return uploadedFileLocation;
      };

    const uploadHandler: UploadHandler = unstable_composeUploadHandlers(
        s3UploadHandler,
        unstable_createMemoryUploadHandler()
      );

    const formData = await unstable_parseMultipartFormData(
      request,
      uploadHandler
    );
  
    const file = formData.get("profile-pic");

    if (!file) {
        return undefined
      }
  
    return file;
  }
  