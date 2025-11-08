import express from 'express';
import { createFamily, updateFamily, deleteFamilyPhoto } from '../controllers/familyController.js';
import auth from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Families
 *   description: Family management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Family:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated family ID
 *         name:
 *           type: string
 *           description: Family name
 *           example: "Smith Family"
 *         description:
 *           type: string
 *           description: Family description
 *           example: "A happy family of four"
 *         familyPhoto:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               description: Cloudinary URL for the family photo
 *             public_id:
 *               type: string
 *               description: Cloudinary public ID for the photo
 *         createdBy:
 *           type: string
 *           description: User ID who created the family
 *         members:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who are family members
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     FamilyInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Family name
 *           example: "Smith Family"
 *         description:
 *           type: string
 *           description: Family description
 *           example: "A happy family of four"
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: Error message
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           description: Detailed validation errors
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           description: Success message
 *         family:
 *           $ref: '#/components/schemas/Family'
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/families:
 *   post:
 *     summary: Create a new family
 *     description: Create a new family with optional family photo. The authenticated user becomes the family admin.
 *     tags: [Families]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Family name
 *                 example: "Smith Family"
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 description: Family description
 *                 example: "A happy family of four"
 *                 maxLength: 500
 *               familyPhoto:
 *                 type: string
 *                 format: binary
 *                 description: Family photo image file (JPEG, PNG, GIF - max 5MB)
 *     responses:
 *       201:
 *         description: Family created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     family:
 *                       $ref: '#/components/schemas/Family'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingName:
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   errors: ["Name is required"]
 *               invalidFile:
 *                 value:
 *                   success: false
 *                   message: "Only image files are allowed"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       409:
 *         description: Conflict - user already belongs to a family
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "You already belong to a family"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', auth, uploadSingle('familyPhoto'), createFamily);

/**
 * @swagger
 * /api/families/{id}:
 *   put:
 *     summary: Update family information
 *     description: Update family details and/or photo. Only the family admin can update the family.
 *     tags: [Families]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Family ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Family name
 *                 example: "Updated Family Name"
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 description: Family description
 *                 example: "Updated family description"
 *                 maxLength: 500
 *               familyPhoto:
 *                 type: string
 *                 format: binary
 *                 description: New family photo image file (JPEG, PNG, GIF - max 5MB)
 *     responses:
 *       200:
 *         description: Family updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     family:
 *                       $ref: '#/components/schemas/Family'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user is not the family admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Not authorized to update this family"
 *       404:
 *         description: Family not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Family not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', auth, uploadSingle('familyPhoto'), updateFamily);

/**
 * @swagger
 * /api/families/{id}/photo:
 *   delete:
 *     summary: Delete family photo
 *     description: Remove the family photo. Only the family admin can delete the photo.
 *     tags: [Families]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Family ID
 *     responses:
 *       200:
 *         description: Family photo deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     family:
 *                       $ref: '#/components/schemas/Family'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user is not the family admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Not authorized"
 *       404:
 *         description: Family not found or no photo exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               familyNotFound:
 *                 value:
 *                   success: false
 *                   message: "Family not found"
 *               noPhoto:
 *                 value:
 *                   success: false
 *                   message: "No family photo found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id/photo', auth, deleteFamilyPhoto);

export default router;