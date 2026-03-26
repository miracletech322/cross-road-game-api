const router = require('express').Router();

const adController = require('../controllers/ad.controller');
const { authenticate, requireAdmin } = require('../middleware/user.middleware');

/**
 * @openapi
 * tags:
 *   - name: Ads
 *     description: Ad placements configuration for the game
 */

/**
 * @openapi
 * /api/ads/active:
 *   get:
 *     tags: [Ads]
 *     summary: Public list of enabled ads
 *     parameters:
 *       - in: query
 *         name: placement
 *         schema:
 *           type: string
 *         description: Optional placement key to filter (e.g. "main")
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Enabled ads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ads:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/active', adController.listActiveAds);

/**
 * @openapi
 * /api/ads/active/me:
 *   get:
 *     tags: [Ads]
 *     summary: Active ads for the current user (respects adblock)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: placement
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Enabled ads for user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ads:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/active/me', authenticate, adController.listActiveAdsForMe);

/**
 * @openapi
 * /api/ads:
 *   get:
 *     tags: [Ads]
 *     summary: List all ads (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Ads list
 */
router.get('/', authenticate, requireAdmin, adController.listAds);

/**
 * @openapi
 * /api/ads:
 *   post:
 *     tags: [Ads]
 *     summary: Create an ad (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type, placement, imageUrl]
 *             properties:
 *               title: { type: string }
 *               type: { type: string, enum: [banner, interstitial, rewarded, video] }
 *               placement: { type: string }
 *               imageUrl: { type: string }
 *               linkUrl: { type: string, nullable: true }
 *               enabled: { type: boolean }
 *               sortOrder: { type: integer }
 *     responses:
 *       201:
 *         description: Created ad
 */
router.post('/', authenticate, requireAdmin, adController.createAd);

/**
 * @openapi
 * /api/ads/{id}:
 *   put:
 *     tags: [Ads]
 *     summary: Update ad (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated ad
 */
router.put('/:id', authenticate, requireAdmin, adController.updateAd);

/**
 * @openapi
 * /api/ads/{id}:
 *   delete:
 *     tags: [Ads]
 *     summary: Delete ad (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted ad
 */
router.delete('/:id', authenticate, requireAdmin, adController.deleteAd);

module.exports = router;

