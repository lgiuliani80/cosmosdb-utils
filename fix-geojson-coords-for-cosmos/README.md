# Fix geoJSON polygons

## Motivation

Geospatial APIs [https://docs.microsoft.com/en-us/azure/cosmos-db/sql/sql-query-geospatial-query] like ST_WITHIN, ST_DISTANCE, ST_INTERSECTS require spacial expressions specified in geoJSON format. When working with _polygons_ and _multipolygons_ the list of vertexes are *REQUIRED* to be ordered in clockwise order for ADDITIVE polygons (=actual areas) and counterclockwise for SUBTRACTIVE polygons (=holes). If this rules are not respected ST_ISVALID() will return _false_, thus making that geographical features not being considered in geospatial queries.  
This script will update in place the documents in the specified container containing geoJSON features fixing those polygons/multipolygons which do not respect the rules above.

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

## References

- https://docs.microsoft.com/en-us/azure/cosmos-db/sql/sql-query-geospatial-intro
- https://docs.microsoft.com/en-us/azure/cosmos-db/sql/sql-query-geospatial-query
