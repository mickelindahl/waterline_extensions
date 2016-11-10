/**
 * Created by s057wl on 2016-07-18.
 */

const we=require('../index');

module.exports = {

    identity: 'test',

    attributes: {
        test_id:'integer',
        test: 'datetime',
        dummy: 'string',
        dummy2:'json',
        dummy3:'json',
        dummy4:'json'
    },

    createOrUpdate:function(options, callback){
        // console.dir()
        options.model=this;//options.server.getModel('test');
        return we.createOrUpdate(options, callback)
    }
};