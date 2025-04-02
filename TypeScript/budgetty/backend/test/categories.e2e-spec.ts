import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestHelper } from './test-helper';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    app = await TestHelper.createTestingApp();
    
    // Register and login a test user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await TestHelper.closeTestingApp(app);
  });

  describe('POST /categories', () => {
    it('should create a new category', () => {
      return request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Category',
          type: 'expense',
          color: '#FF0000',
          icon: 'shopping_cart',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Category');
          expect(res.body.type).toBe('expense');
          expect(res.body.color).toBe('#FF0000');
          expect(res.body.icon).toBe('shopping_cart');
        });
    });

    it('should not create category without token', () => {
      return request(app.getHttpServer())
        .post('/categories')
        .send({
          name: 'Test Category',
          type: 'expense',
          color: '#FF0000',
          icon: 'shopping_cart',
        })
        .expect(401);
    });
  });

  describe('GET /categories', () => {
    it('should get all categories for the user', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should filter categories by type', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ type: 'expense' })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((category: any) => {
            expect(category.type).toBe('expense');
          });
        });
    });
  });

  describe('GET /categories/:id', () => {
    let categoryId: number;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Category for Get',
          type: 'expense',
          color: '#00FF00',
          icon: 'restaurant',
        });
      categoryId = response.body.id;
    });

    it('should get category by id', () => {
      return request(app.getHttpServer())
        .get(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(categoryId);
          expect(res.body.name).toBe('Test Category for Get');
        });
    });

    it('should return 404 for non-existent category', () => {
      return request(app.getHttpServer())
        .get('/categories/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /categories/:id', () => {
    let categoryId: number;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Category for Update',
          type: 'expense',
          color: '#0000FF',
          icon: 'home',
        });
      categoryId = response.body.id;
    });

    it('should update category', () => {
      return request(app.getHttpServer())
        .patch(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Category',
          color: '#FF00FF',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Category');
          expect(res.body.color).toBe('#FF00FF');
        });
    });
  });

  describe('DELETE /categories/:id', () => {
    let categoryId: number;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Category for Delete',
          type: 'expense',
          color: '#FFFF00',
          icon: 'delete',
        });
      categoryId = response.body.id;
    });

    it('should delete category', () => {
      return request(app.getHttpServer())
        .delete(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Category deleted successfully');
        });
    });

    it('should return 404 when trying to delete non-existent category', () => {
      return request(app.getHttpServer())
        .delete('/categories/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
}); 