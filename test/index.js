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

let lab = exports.lab = Lab.script();

lab.experiment('waterline', function () {

    lab.before({},function (done) {

        // console.log('before')
        let iv = setInterval( function () {
            if (server.app.readyForTest == true) {
                clearInterval(iv);
                let Model=server.getModel('test');
                // console.log(Model)
                let data=[];
                for (let i=0; i<10;i++){
                    data.push({
                        test:' entry '+i,
                    })
                }
                Model.create(data).exec( function(err, models){
                    done();
                });
            }
        }, 50);
    });

    lab.test('createOrUpdate', function (done) {
        let data=[];
        for (let i=0; i<20;i++){
            data.push({test:' entry '+i,
                dummy:'hej'})
        }
        let Model=server.getModel('test');
        let options={
            keys:['test'],
            results: data
        };

        Model.createOrUpdate(options, function(err, models){

            for (let i=0;i<10;i++){
                Code.expect(models[i].createdAt.toJSON()==models[i].updatedAt.toJSON()).to.be.false();
                Code.expect('hej'==models[i].dummy).to.be.true();

            }
            for (let i=10;i<20;i++){
                Code.expect(models[i].createdAt.toJSON()==models[i].updatedAt.toJSON()).to.be.true();
                Code.expect('hej'==models[i].dummy).to.be.true();
            }
            done()
        })
    });

    lab.test('createOrUpdate append, sort and unique', function (done) {

        let data1=[];
        let data2=[];
        let data3=[];

        for (let i=0; i<2;i++){
            data1.push({
                test: ' entry ' + i,
                dummy2: ['5'],
                dummy3: [{id: new Date().toJSON()}],
            });
            data2.push({
                test:' entry '+i,
                dummy2:['10'],
                dummy3:[{id:new Date(new Date().valueOf()+2000).toJSON()}],
            });
            data3.push({
                test:' entry '+i,
                dummy2:['10'],
                dummy3:data2[data2.length-1].dummy3,
            })
        }

        let Model=server.getModel('test');

        let options={
            keys:['test'],
            results: data1
        };
        Model.createOrUpdate(options, function(err, models){

            let options={
                keys:['test'],
                results: data2,
                append:[
                    {
                        key:'dummy2',
                        unique:true,
                        sort:{
                            order:'ascending',
                            'callback':(val)=>{return Number(val)}
                        }
                    },
                    {
                    key:'dummy3',
                    unique:{key:'id'},
                    sort:{
                        order:'ascending',
                        key:'id',
                        'callback':(val)=>{return new Date(val).valueOf()}
                        }
                    }
                ]
            };

            Model.createOrUpdate(options, function(err, models) {

                models.forEach((model)=>{
                    Code.expect(Number(model.dummy2[0])>Number(model.dummy2[1])).to.be.true();
                    Code.expect(model.dummy3[0].id>model.dummy3[1].id).to.be.true();
                });

                options.results=data3;
                Model.createOrUpdate(options, function(err, models) {
                    models.forEach((model)=>{
                        Code.expect(model.dummy2.length).to.equal(2);
                        Code.expect(model.dummy3.length).to.equal(2);
                    });
                    done()
                });


            })
        })
    });

});