import mongoose from "mongoose";
import User from "../models/User.js";
import Child from "../models/Child.js";

const { ObjectId } = mongoose.Types;

export async function resolveChildAccess(parentId, providedId) {
  try {
    console.log("DEBUG RAW IDS:", { parentId, providedId });

    // Handle null/undefined inputs
    if (!parentId || !providedId) {
      console.log("DEBUG: Missing parentId or providedId");
      return null;
    }

    // Convert to strings first for validation
    const parentIdStr = String(parentId);
    const providedIdStr = String(providedId);

    // Safely convert IDs
    if (!ObjectId.isValid(parentIdStr) || !ObjectId.isValid(providedIdStr)) {
      console.log("DEBUG: Invalid ObjectId format", { parentIdStr, providedIdStr });
      return null;
    }

    const parentObjId = new ObjectId(parentIdStr);
    const providedObjId = new ObjectId(providedIdStr);

    console.log("DEBUG: Converted IDs:", { parentObjId, providedObjId });

    // FIRST: Try matching in Child model
    const childDoc = await Child.findOne({
      $or: [
        { _id: providedObjId },
        { user: providedObjId }
      ],
      parent: parentObjId
    }).populate("user", "_id name");

    console.log("DEBUG: ChildDoc result:", childDoc);

    if (childDoc) {
      return {
        userId: childDoc.user._id.toString(),
        name: childDoc.user.name
      };
    }

    // SECOND: Try matching via User model
    const childUser = await User.findOne({
      _id: providedObjId,
      role: "child",
      "child.parent": parentObjId
    }).select("_id name child.parent");

    console.log("DEBUG: ChildUser result:", childUser);

    if (childUser) {
      return {
        userId: childUser._id.toString(),
        name: childUser.name
      };
    }

    console.log("DEBUG: No match in either Child or User model");
    return null;

  } catch (err) {
    console.error("ERROR in resolveChildAccess:", err);
    return null;
  }
}
