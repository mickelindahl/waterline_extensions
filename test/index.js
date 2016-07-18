/**
 * Created by s057wl on 2016-07-18.
 */

/**
 * Created by s057wl on 2016-07-14.
 */
'use strict'

const Code = require('code');   // assertion library
const Lab=require('lab');
const server = require('../test_server');

var lab = exports.lab = Lab.script();

lab.experiment('waterline', function () {

    lab.before({},function (done) {


        // console.log('before')
        var iv = setInterval( function () {
            if (server.app.readyForTest == true) {
                clearInterval(iv);
                var Model=server.getModel('test');
                // console.log(Model)
                var data=[];
                for (var i=0; i<10;i++){
                    data.push({'test':' entry '+i})
                }
                Model.create(data).exec( function(err, models){
                    done();
                });
            }
        }, 50);
    });

    lab.test('createOrUpdate', function (done) {
        var data=[];
        for (var i=0; i<20;i++){
            data.push({'test':' entry '+i})
        }
        var Model=server.getModel('test');
        var options={
            keys:['test'],
            results: data
        };

        Model.createOrUpdate(options, function(err, models){

            for (var i=0;i<10;i++){
                Code.expect(models[i].createdAt.toJSON()==models[i].updatedAt.toJSON()).to.be.false();
            }
            for (var i=10;i<20;i++){
                Code.expect(models[i].createdAt.toJSON()==models[i].updatedAt.toJSON()).to.be.true();
            }

            done()
        })

    });

});