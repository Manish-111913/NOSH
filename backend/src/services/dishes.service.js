import { withTransaction } from '../db/transaction.js';
import * as dishesRepository from '../repositories/dishes.repository.js';
import { badRequest, conflict, notFound } from '../utils/httpErrors.js';
import { isValidImageUrl } from '../utils/imageUrl.js';

const dishNotFound = (dishId) => notFound('DISH_NOT_FOUND', `Dish "${dishId}" was not found.`);

export function createDishesService(pool) {
  return {
    listDishes() {
      return dishesRepository.findAll(pool);
    },

    async getDish(dishId) {
      const dish = await dishesRepository.findById(pool, dishId);
      if (!dish) throw dishNotFound(dishId);
      return dish;
    },

    /**
     * Optimistic concurrency control, done atomically in one transaction:
     *   1. lock the row (SELECT ... FOR UPDATE)
     *   2. 404 if missing, 409 if the stored version differs from expectedVersion
     *   3. validate publishing rules against the stored image URL
     *   4. save the explicit values and increment the version
     * Any thrown error rolls the transaction back, so rejected requests change nothing.
     */
    updateDish(dishId, { dishName, isPublished, expectedVersion }) {
      return withTransaction(pool, async (client) => {
        const current = await dishesRepository.findByIdForUpdate(client, dishId);
        if (!current) throw dishNotFound(dishId);

        if (current.version !== expectedVersion) {
          throw conflict('VERSION_CONFLICT', 'This dish was updated elsewhere. Reload the latest version before saving again.', {
            data: { currentDish: current },
          });
        }

        if (isPublished) {
          if (dishName.length === 0) {
            throw badRequest('DISH_NAME_REQUIRED', 'A published dish must have a non-empty name.');
          }
          if (!isValidImageUrl(current.imageUrl)) {
            throw badRequest('INVALID_IMAGE_URL', 'This dish cannot be published because its image URL is not a valid HTTP or HTTPS URL.');
          }
        }

        return dishesRepository.updateNameAndStatus(client, dishId, { dishName, isPublished });
      });
    },
  };
}
