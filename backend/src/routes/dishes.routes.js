import { Router } from 'express';
import { createDishesController } from '../controllers/dishes.controller.js';
import { createDishesService } from '../services/dishes.service.js';

export function createDishesRouter(pool) {
  const controller = createDishesController(createDishesService(pool));
  const router = Router();

  router.get('/', controller.list);
  router.get('/:dishId', controller.getOne);
  router.patch('/:dishId', controller.update);

  return router;
}
