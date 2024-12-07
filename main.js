import redisClient from './utils/redis';

(async () => {
    // Wait for the client to connect
    await new Promise((resolve) => {
      const checkConnection = setInterval(() => {
        if (redisClient.isAlive()) {
          clearInterval(checkConnection);
          resolve();
        }
      }, 100);
    });

    console.log(redisClient.isAlive());
    console.log(await redisClient.get('myKey'));
    await redisClient.set('myKey', 12, 5);
    console.log(await redisClient.get('myKey'));

    setTimeout(async () => {
        console.log(await redisClient.get('myKey'));
    }, 1000 * 10);
})();
