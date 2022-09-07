import AWS, { S3 } from "aws-sdk";
import { FileStoreApi } from "file-store";

export type S3FileStoreOptions = {
  endpoint: string;
  bucketName: string;
  s3Options?: S3.ClientConfiguration;
};

export class S3FileStore extends FileStoreApi {
  bucketName: string;
  s3: S3;
  endpoint: string;

  constructor(prefix: string, options: S3FileStoreOptions) {
    super(prefix);
    this.bucketName = options.bucketName;
    this.s3 = new AWS.S3({ ...options.s3Options });
    this.endpoint = options.endpoint;
  }

  public async exists(filename: string): Promise<boolean> {
    const object = await this.s3
      .getObjectAcl({
        Bucket: this.bucketName,
        Key: this.getPath(filename),
      })
      .promise();
    return !!object.Grants;
  }

  async read(filename: string): Promise<any> {
    const data = await this.s3
      .getObject({
        Bucket: this.bucketName,
        Key: this.getPath(filename),
      })
      .promise();
    /* istanbul ignore if */
    if (!data.Body) {
      throw new Error("Body is undefined");
    }
    return JSON.parse(data.Body.toString("ascii"));
  }

  async write(filename: string, data: any): Promise<void> {
    await this.s3
      .putObject({
        Bucket: this.bucketName,
        Key: this.getPath(filename),
        ContentType: "application/json",
        ACL: "public-read",
        Body: JSON.stringify(data),
      })
      .promise();
  }

  getPath(filename: string) {
    return `${this.prefix}/${filename}`;
  }

  async reset(): Promise<void> {
    // delete then recreate the bucket
    try {
      await this.s3
        .deleteBucket({
          Bucket: this.bucketName,
        })
        .promise();
      // eslint-disable-next-line  no-empty
    } catch (e) {}
    try {
      await this.s3
        .createBucket({
          Bucket: this.bucketName,
        })
        .promise();
      // eslint-disable-next-line  no-empty
    } catch (e) {}
  }

  public url(filename: string): string {
    return `${this.endpoint}/${this.bucketName}/${this.getPath(filename)}`;
  }

  async readFromUrl(url: string): Promise<any> {
    return this.read(url.substring(`/file-store/${this.prefix}/`.length));
  }

  /* istanbul ignore next */
  public registerRoutes() {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return async () => {};
  }
}
