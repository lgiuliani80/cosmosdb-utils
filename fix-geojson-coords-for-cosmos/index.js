const fs = require("fs");
const { CosmosClient } = require("@azure/cosmos");

const DBNAME = "<cosmos-database-name>";
const CONTAINER = "<container-name>";
const endpoint = "https://<my-cosmos-db>.documents.azure.com";
const key = "<my-key>";
const client = new CosmosClient({ endpoint, key });

const LATITUDE = 1;
const LONGITUDE = 0;

function toRadians(v) { return v * Math.PI / 180; }

function polarTriangleArea(tan1, lng1, tan2, lng2) {
    let deltaLng = lng1 - lng2;
    let t = tan1 * tan2;
    return 2 * Math.atan2(t * Math.sin(deltaLng), 1 + t * Math.cos(deltaLng));
}

function computeSignedArea(path, radius) {
    if (radius === undefined) radius = 6371009;
    
    let size = path.length;
    if (size < 3) {
        return 0;
    }

    let total = 0;
    let prev = path[size - 1];
    let prevTanLat = Math.tan((Math.PI / 2 - toRadians(prev[LATITUDE])) / 2);
    let prevLng = toRadians(prev[LONGITUDE]);

    // For each edge, accumulate the signed area of the triangle formed by the North Pole
    // and that edge ("polar triangle").

    for (let point of path) {
        let tanLat = Math.tan((Math.PI / 2 - toRadians(point[LATITUDE])) / 2);
        let lng = toRadians(point[LONGITUDE]);
        total += polarTriangleArea(tanLat, lng, prevTanLat, prevLng);
        prevTanLat = tanLat;
        prevLng = lng;
    }

    return total * (radius * radius);
}

/** Assumes a file named 'invalid-geos.json' exists in the current directory.
 * The file shall contain a JSON array according to the following pattern:
 * 
 * [
 *    {
 *        "id": "<document-id>",
 *        "partitionKey": "<partition-key>",
 *        "geometry": <geoJSON>
 *    },
 *    ...
 * ]
 *
 * NOTE: the JSON file will be entirely read into memory so shall fit into the free RAM memory.
 */
async function upsertCosmos() {
    const db = client.database(DBNAME);
    const cont = db.container(CONTAINER);

    const invalids = JSON.parse(fs.readFileSync("invalid-geos.json"));

    let counter = 0;

    for (c of invalids)
    {
        let cit = cont.item(c.id, c.partitionKey);
        let readResponse = await cit.read();
        let doc = readResponse.resource;
        let changed = false;

        console.log("> Fixing element #" + (++counter) + "...");

        for (let i in doc.geometry.coordinates)
        {
            let sum = computeSignedArea(doc.geometry.coordinates[i][0]);
            
            if (sum < 0)
            {
                console.warn("     The ADDITIVE polygon is counterclockwise - reverse it!");
                doc.geometry.coordinates[i][0].reverse();
                changed = true;
                console.log("     New ADDITIVE area is " + computeSignedArea(doc.geometry.coordinates[i][0]));
            }

            for (let j = 1; j < doc.geometry.coordinates[i].length; j++)
            {
                sum = computeSignedArea(doc.geometry.coordinates[i][j]);
                if (sum > 0)
                {
                    console.warn("     The SUBTRACTIVE polygon " + j + " is clockwise - reverse it!");
                    doc.geometry.coordinates[i][j].reverse();
                    changed = true;
                    console.log("     New SUBSTRACTIVE area " + j + " is " + computeSignedArea(doc.geometry.coordinates[i][j]));
                }
            }
        }

        if (changed)
        {
            let result = await cit.replace(doc);
            console.log("   + Record Updated!", result);
        }
        else
        {
            console.log("   - Record was already valid. No update occurred.");
        }
    }
}

upsertCosmos().catch(err => {
  console.error(err);
});