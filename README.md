RSS Reader
==========

[How to use Azure Table storage from Node.js](https://docs.microsoft.com/en-us/azure/storage/storage-nodejs-how-to-use-table-storage)

FeedScan
--------

**index.js:** Trigger Function to iterate through feeds and insert new entries into table storage.

**config.js:** Configuration values for all Functions.

QueryFeed
---------

**index.js:** Http Function to retrieve the top five entries from each feed.

Todo
----

[ ] Setup CI of functions
[ ] Stop inserting when first duplicate entry is found
[ ] Create UI
[ ] Purge items after a certain time
[ ] Mark items as read
