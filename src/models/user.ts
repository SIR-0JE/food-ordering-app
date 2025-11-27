import { Model, Schema, model, models } from "mongoose";

export interface UserDocument {
  fullName: string;
  phone: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, unique: true },
  },
  { timestamps: true }
);

const UserModel: Model<UserDocument> =
  (models.User as Model<UserDocument>) || model<UserDocument>("User", UserSchema);

export default UserModel;


