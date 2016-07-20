/**
 * Created by s057wl on 2016-07-18.
 */

const Async=require('async');

function createOrUpdate(options, callback) {
    var calls=[];

    options.results.forEach(function (res) {
        calls.push(function(_callback){
            var criteria={};
            options.keys.forEach(function(key){
                criteria[key]=res[key]
            });

            options.model.find(criteria).exec(function (err, models) {
                if (err) {
                    return _callback(err);
                }
                if (models.length == 0) {
                    options.model.create(res).exec(function (err, model) {
                        if (err) {
                            return _callback(err);
                        }
                        _callback(null, model)
                    });
                } else {
                    options.model.update(criteria, res).exec(function (err, model) {
                        if (err) {
                            console.log(err)
                            return _callback(err);
                        }
                        _callback(null, model[0])
                    });
                }
            })
        })
    });

    Async.series(calls,function(err, models){
        // console.log(models)
        callback(err, models)
    })
}

module.exports={
    'createOrUpdate':createOrUpdate
}