import { expect } from 'chai';

import { Monad, MonadInstances, ContextDependent_, ContextDependent } from '../../src/typeclasses/monad';

describe('monad', () => {

  xdescribe('monad laws', () => {
  });

  describe('Reader monad example: dependency injection', () => {

    interface Connection {}
    type ConnectionDependent_ = ContextDependent_<Connection>
    type ConnectionDependent<T> = ContextDependent<Connection, T>

    interface UserId {}
    class User {
      constructor(readonly id: UserId, public name: string) {}
    }
    class UserDao {
      // Might also use Option here to avoid dealing with null values
      persistedUser: User = null
      insertUser(user: User): ConnectionDependent<void> {
        return ((connection: Connection) => { this.persistedUser = user }) as ConnectionDependent<void>;
      }
      updateUser(userId: UserId, name: string): ConnectionDependent<void> {
        return ((connection: Connection) => { this.persistedUser.name = name }) as ConnectionDependent<void>;
      }
      getUser(userId: UserId): ConnectionDependent<User> {
        return ((connection: Connection) => {
          return this.persistedUser;
        }) as ConnectionDependent<User>;
      }
    }

    it('should allow to pass context seemlessly', async () => {
      const connection = {} as Connection;
      const userId = "UserId";
      const userName = "UserName";
      const userNameUpdated = "UserNameUpdated"
      const user = new User(userId, userName)

      let dao = new UserDao();
      let m: Monad<ConnectionDependent_> = MonadInstances.readerMonad<Connection>();

      /*
       * Now using the Reader monad it is possible to compose database operations together
       */
      let compositeDaoOperation: ConnectionDependent<User> = m.flatMap(dao.insertUser(user), _ =>
        m.flatMap(dao.updateUser(userId, userNameUpdated), _ =>
          dao.getUser(userId)
        )
      ) as ConnectionDependent<User>;

      expect(compositeDaoOperation(connection)).to.eql(new User(userId, userNameUpdated));
    });
  });
});