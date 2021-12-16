# Fix geoJSON polygons

## Prerequisite steps

* Update the references to the CosmosDB instance, database and container, along with the name of the partition key (if needed).
* Create the `invalid-geos.json`.  
  The file shall contain a JSON array according to the following pattern:
  
        [
           {
               "id": "<document-id>",
               "partitionKey": "<partition-key>",
               "geometry": <geoJSON>
           },
           ...
        ]
   
## Usage

    node index.js

run from a folder containing `invalid-geos.json`.
