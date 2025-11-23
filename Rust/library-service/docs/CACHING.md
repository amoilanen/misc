# Caching Guide

The Library Service uses Redis for caching frequently accessed data to improve performance.

## Overview

- **Cache Backend**: Redis
- **Default TTL**: 3600 seconds (1 hour), configurable via `CACHE_TTL_SECONDS`
- **Cache Keys**: Structured keys for books, users, and search results
- **Cache Invalidation**: Automatic invalidation on updates/deletes

## What is Cached

1. **Books**: Individual book lookups by ID
2. **Users**: User lookups by ID
3. **Search Results**: Book search queries (by author, genre, title)

## Cache Keys

- Books: `book:{uuid}`
- Users: `user:{uuid}`
- Search: `book:search:{author}:{genre}:{title}`

## Configuration

Set Redis URL:
```bash
export REDIS_URL="redis://localhost:6379"
```

Set cache TTL (in seconds):
```bash
export CACHE_TTL_SECONDS="3600"  # 1 hour
```

## Cache Behavior

### Cache Hits
When data is found in cache, it's returned immediately without database query:
```
Request → Cache Check → Cache Hit → Return Cached Data
```

### Cache Misses
When data is not in cache:
```
Request → Cache Check → Cache Miss → Database Query → Cache Result → Return Data
```

### Cache Invalidation
Cache is automatically invalidated when:
- Book is created, updated, or deleted
- Book is loaned or returned (affects available copies)
- User is updated

## Graceful Degradation

If Redis is unavailable, the service continues to operate without caching:
- Logs a warning
- All requests go directly to the database
- No errors are returned to clients

## Monitoring Cache

### Check Redis Connection
```bash
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### View Cache Keys
```bash
docker-compose exec redis redis-cli keys "book:*"
docker-compose exec redis redis-cli keys "user:*"
```

### Check Cache Statistics
```bash
docker-compose exec redis redis-cli info stats
```

### Clear Cache
```bash
# Clear all cache
docker-compose exec redis redis-cli flushall

# Clear specific pattern
docker-compose exec redis redis-cli --scan --pattern "book:*" | xargs redis-cli del
```

## Performance Impact

Caching significantly improves performance for:
- Frequently accessed books (popular titles)
- User profile lookups
- Repeated search queries

Expected improvements:
- Book lookups: ~10-50ms → ~1-5ms (cache hit)
- Search queries: ~50-200ms → ~1-10ms (cache hit)

## Best Practices

1. **TTL Tuning**: Adjust `CACHE_TTL_SECONDS` based on data update frequency
   - Frequently updated: Lower TTL (e.g., 300 seconds)
   - Rarely updated: Higher TTL (e.g., 3600 seconds)

2. **Memory Management**: Monitor Redis memory usage
   ```bash
   docker-compose exec redis redis-cli info memory
   ```

3. **Cache Warming**: Pre-populate cache for frequently accessed items

4. **Cache Patterns**: Use consistent key patterns for easy management

## Troubleshooting

### Cache Not Working
1. Check Redis is running: `docker-compose ps redis`
2. Check connection: `docker-compose logs redis`
3. Verify `REDIS_URL` environment variable
4. Check service logs for cache connection errors

### High Memory Usage
1. Reduce TTL
2. Implement cache eviction policies
3. Monitor key patterns
4. Clear unused keys

### Stale Data
1. Check TTL settings
2. Verify cache invalidation on updates
3. Manually clear cache if needed

