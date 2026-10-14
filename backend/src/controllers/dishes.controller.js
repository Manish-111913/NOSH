import { parseDishId, parseUpdateDishBody } from '../validators/dishes.validator.js';

// Thin HTTP layer: validate input, call the service, send JSON. Errors go to the error handler.
export function createDishesController(dishesService) {
  return {
    async list(req, res) {
      res.json(await dishesService.listDishes());
    },

    async getOne(req, res) {
      const dishId = parseDishId(req.params.dishId);
      res.json(await dishesService.getDish(dishId));
    },

    async update(req, res) {
      const dishId = parseDishId(req.params.dishId);
      const changes = parseUpdateDishBody(req.body);
      res.json(await dishesService.updateDish(dishId, changes));
    },
  };
}
