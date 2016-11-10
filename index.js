/**
 * Created by s057wl on 2016-07-18.
 */
'use strict';
const Promise = require( 'bluebird' )
const debug = require( 'debug' )( 'waterline_extension' );


function _createOrUpdate( options, res ) {

    return new Promise( ( resolve, reject )=> {

        let criteria = {};
        options.keys.forEach( ( key )=> {
            criteria[key] = res[key]
        } );

        debug( 'Criteria', criteria );

        options.model.find( criteria ).then(models => {

            let promise;

            if ( models.length == 0 ) {

                debug( '\x1b[0;31mModel not found creating\x1b[0;37m' );

                // If append or update options and sort elements
                if ( options.append_or_update ) {

                    options.append_or_update.forEach(app=>{

                        if ( app.sort ) {

                            debug('sorting elements')
                            res[app.key] = sortElements( res[app.key], app.sort.order, app.sort.key )

                        }
                    })
                }

                promise=options.model.create( res ).then(model =>{

                    resolve( model )

                } )
            } else {

                if ( models.length != 1 ) {
                    debug( 'More than one model exit for that key, now allowed!' );
                    models.forEach(m=>{JSON.stringify(models)});
                    return reject( 'More than one model exit for that key, now allowed!' )
                }

                debug( '\x1b[0;33mModel found updating\x1b[0;37m' );

                // Push values to arrays or append to value if it exists in the array
                if ( options.append_or_update ) {
                    res = appemdOrUpdate( options, res, models, reject )
                    // debug('updating',res)
                }

                promise=options.model.update( criteria, res ).then( model => {
                    debug('createdAt',model[0].createdAt)
                    debug('updatedAt', model[0].updatedAt)

                    resolve( model[0] )

                } );
            }
            // Attached catch
            promise.catch(err=>{

                return reject( err );

            });

        } )
    } )
}

function elementOperation(key){

    let callback;

    switch ( typeof key ) {

        case "undefined":
            callback = ( e )=> {return e};
            break;

        case 'string':

            callback = ( e )=> { e[key]};
            break;

        case 'function':

            debug('it is a function');
            callback=key;
            break
    }

    return callback

}

function sortElements(elements, order, key){

    debug('sorting order', order, 'key', key)

    let callback=elementOperation(key);;
    let cmp;

    // sort on each post by time
    elements.sort( ( a, b )=> {

        a=callback(a)
        b=callback(b)

        let val;

        if ( order == 'ascending' ) {
            debug('ascending', order)
            val = 1;
        }

        if ( order == 'descending' ) {
            debug('descending', order)
            val = -1;
        }

        if ( a < b )
            return -1*val;
        if ( a > b )
            return 1*val;
        return 0;

    } );

    return elements

}

function appemdOrUpdate( options, res, models, reject ) {

    options.append_or_update.forEach( ( app )=> {

        // Add to element if exist else just add element
        res[app.key].forEach( ( val )=> {

            let add = true;

            debug(app.unique)

            // If it yet does not exist
            if (!models[0][app.key]){

                models[0][app.key]=[val]

            }


            if ( app.unique ) {

                let callback=elementOperation(app.unique.key);

                debug('callback', callback);
                debug('cmp', callback(val) , app.key, models);
                debug(app)
                debug('cmp with', models[0][app.key].map( callback ))

                // do not add if it exist
                let pos = models[0][app.key].map( callback ).indexOf(callback(val)  );

                debug('pos', pos)

                if ( pos != -1 ) {

                    // update if value exists
                    if ( app.unique.key ) {
                        debug( 'update since unique key' );
                        for ( let key in val ) {

                            models[0][app.key][pos][key] =  val[key]

                        }
                    }
                    // }
                    add = false;
                }
            }

            if ( add ) {
                models[0][app.key].push( val )
            }

        } );
        res[app.key] = models[0][app.key];

        // Sort elements
        if ( app.sort ) {

            res[app.key]=sortElements(res[app.key], app.sort.order , app.sort.key)

        }

    } );

    return res

}

function createOrUpdate( options, done ) {
    // var calls=[];

    debug( 'entering createOrUpdate' )

    var current = Promise.resolve();

    let p= Promise.all( options.results.map( ( res )=> {
        current = current.then( function () {

            return _createOrUpdate( options, res )
        } );

        return current;

    } ) ).then( ( results )=> {

        if ( done ) {

            debug('No promise return')
            done( null, results );
        }
        else {
            debug('Return promise');
            return results
        }

    } ).catch( ( err )=> {

        if ( done ) done( err, null );
        else throw err

    } );

    debug(p)

    return p

}

module.exports = {
    'createOrUpdate': createOrUpdate
};
