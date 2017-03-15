var azure = require('azure-storage');
var config = require('../FeedScan/config');

module.exports = function (context, req) {
    context.log('Deleting table');

    var tableSvc = azure.createTableService();

    tableSvc.deleteTable(config.table, function(error, response){
        if(error){
            context.done(null, {status: 500, body: 'Error deleting table: ' + JSON.stringify(error)});
        } else {
            context.done(null, {body: 'Deleted ' + config.tables});
        }
    });
};
