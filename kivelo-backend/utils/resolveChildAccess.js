import mongoose from "mongoose";
import User from "../models/User.js";
import Child from "../models/Child.js";

const { ObjectId } = mongoose.Types;

export async function resolveChildAccess(parentId, providedId) {
  try {
    console.log("DEBUG RAW IDS:", { parentId, providedId });

    // Safely convert IDs
    if (!ObjectId.isValid(parentId) || !ObjectId.isValid(providedId)) {
      console.log("DEBUG: Invalid ObjectId format");
      return null;
    }

    const parentObjId = new ObjectId(parentId);
    const providedObjId = new ObjectId(providedId);

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
