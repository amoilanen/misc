import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestHelper } from './test-helper';

describe('EventsController (e2e)', () => {
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

  describe('POST /events', () => {
    it('should create a new event', () => {
      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'expense',
          amount: 100,
          description: 'Test expense',
          date: new Date().toISOString(),
          categoryId: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.type).toBe('expense');
          expect(res.body.amount).toBe(100);
          expect(res.body.description).toBe('Test expense');
        });
    });

    it('should not create event without token', () => {
      return request(app.getHttpServer())
        .post('/events')
        .send({
          type: 'expense',
          amount: 100,
          description: 'Test expense',
          date: new Date().toISOString(),
          categoryId: 1,
        })
        .expect(401);
    });
  });

  describe('GET /events', () => {
    it('should get all events for the user', () => {
      return request(app.getHttpServer())
        .get('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should filter events by date range', () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      return request(app.getHttpServer())
        .get('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /events/:id', () => {
    let eventId: number;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'expense',
          amount: 200,
          description: 'Test expense for get',
          date: new Date().toISOString(),
          categoryId: 1,
        });
      eventId = response.body.id;
    });

    it('should get event by id', () => {
      return request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(eventId);
          expect(res.body.amount).toBe(200);
        });
    });

    it('should return 404 for non-existent event', () => {
      return request(app.getHttpServer())
        .get('/events/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /events/:id', () => {
    let eventId: number;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'expense',
          amount: 300,
          description: 'Test expense for update',
          date: new Date().toISOString(),
          categoryId: 1,
        });
      eventId = response.body.id;
    });

    it('should update event', () => {
      return request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          amount: 350,
          description: 'Updated test expense',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.amount).toBe(350);
          expect(res.body.description).toBe('Updated test expense');
        });
    });
  });

  describe('DELETE /events/:id', () => {
    let eventId: number;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'expense',
          amount: 400,
          description: 'Test expense for delete',
          date: new Date().toISOString(),
          categoryId: 1,
        });
      eventId = response.body.id;
    });

    it('should delete event', () => {
      return request(app.getHttpServer())
        .delete(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Event deleted successfully');
        });
    });

    it('should return 404 when trying to delete non-existent event', () => {
      return request(app.getHttpServer())
        .delete('/events/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
}); 