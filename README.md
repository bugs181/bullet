# bullet
Wrapper around [GunDB](https://github.com/amark/gun) to provide alternative syntax, promise support, utility modules, and easy Gun adapter events.

# Rewriting Gun docs: #

## Original: ##

    var gun = Gun();

    gun.get('mark').put({
      name: "Mark",
      email: "mark@gunDB.io",
    });

    gun.get('mark').on(function(data, key){
      console.log("update:", data);
    });

## With Bullet: ##

    var bullet = new Bullet()

    bullet.mark = {
      name: "Mark",
      email: "mark@gunDB.io",
    }

    bullet.mark.on(data => {
      console.log("update:", data);
    })

## Second Example: ##

    var cat = {name: "Fluffy", species: "kitty"};
    var mark = {boss: cat};
    cat.slave = mark;

    // partial updates merge with existing data!
    gun.get('mark').put(mark);

    // access the data as if it is a document.
    gun.get('mark').get('boss').get('name').once(function(data, key){
      // `val` grabs the data once, no subscriptions.
      console.log("Mark's boss is", data);
    });

    // traverse a graph of circular references!
    gun.get('mark').get('boss').get('slave').once(function(data, key){
      console.log("Mark is the slave!", data);
    });

    // add both of them to a table!
    gun.get('list').set(gun.get('mark').get('boss'));
    gun.get('list').set(gun.get('mark'));

    // grab each item once from the table, continuously:
    gun.get('list').map().once(function(data, key){
      console.log("Item:", data);
    });

    // live update the table!
    gun.get('list').set({type: "cucumber", goal: "scare cat"});

## With Bullet: ##

    var cat = { name: 'Fluffy', species: 'kitty' }
    var mark = { boss: cat }
    cat.slave = mark

    // partial updates merge with existing data!
    bullet.mark = mark

    // access the data as if it is a document.
    let marksBoss = await bullet.mark.boss.name.value
    console.log("Mark's boss is", marksBoss)

    // add both of them to a table!
    bullet.list.set(bullet.mark.boss)
    bullet.list.set(bullet.mark)

    // grab each item once from the table, continuously:
    bullet.list.map().once(data => {
      console.log("Item:", data)
    })

    // live update the table!
    bullet.list.set({ type: "cucumber", goal: "scare cat" })

# How is this possible? #
It's simple really. Bullet wraps the Gun instance with a Proxy. Each property lookup (using dot notation or bracket) calls a `gun.get()` and returns the Proxy to be used for chaining. Any call to `bullet.value` will return a promise getter of `gun.once()`.

# Utilities: #
- `.value` - Promise getter for `.once()`; `let cats = await bullet.cats.value`
- `.remove()` - `bullet.cats.remove()`

# Writing your own Gun adapter, made easy: #
One of the best features of Bullet is to write Gun adapters without having to know too much about the Gun constructor, proper placement to initialize your adapter, and bugs caused by not forwarding the events. Bullet takes care of all of this for you! Simply define an `Object` or `Class`, return an object that contains the events you want to hook into, and the rest is up to you.

Example:

    class gunAdapter {
      constructor(bullet, opts, context) {
        return {
          events : {
            get: function(...),
            put: function(...),
            in: function(...),
            out: function(...),
          }
        }
      }
    }

To include your adapter into Bullet, include it in your project file then:<br>
`bullet.extend(gunAdapter)`

# More coming soon! #
Bullet expects to be a wrapper for other utility functions, offering an easy way to extend either bullet or gun via Proxies or directly. This will allow you to create custom bullet methods for wrapping verbose syntaxes.

Some utility proposals have already emerged, such as handling arrays in a more suitable fashion.

    bullet.cats.sparky = { color: 'orange' }
    bullet.cats.howie = { color: 'white' }

    bullet.mark.cats = [bullet.cats.sparky, bullet.cats.howie]

Another utility proposal was RPC

    // local
    bullet.rpc.host('peerName')
    bullet.rpc.register('procName', function(data) {})

    // Remote
    bullet.rpc.exec('procName', { some: 'data' })
    // or
    bullet.rpc.select('peerName').exec('procName')

<br>

## License: ##
[MIT](https://github.com/bugs181/bullet/blob/master/LICENSE)
