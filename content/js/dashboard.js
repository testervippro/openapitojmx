/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 10.0, "KoPercent": 90.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.1, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "PUT /pet"], "isController": false}, {"data": [0.0, 500, 1500, "GET /pet/findByTags"], "isController": false}, {"data": [0.0, 500, 1500, "POST /store/order"], "isController": false}, {"data": [0.0, 500, 1500, "POST /pet"], "isController": false}, {"data": [0.0, 500, 1500, "GET /pet/findByStatus"], "isController": false}, {"data": [0.0, 500, 1500, "GET /pet/{petId}"], "isController": false}, {"data": [1.0, 500, 1500, "GET /user/logout"], "isController": false}, {"data": [0.0, 500, 1500, "DELETE /pet/{petId}"], "isController": false}, {"data": [0.0, 500, 1500, "POST /user/createWithArray"], "isController": false}, {"data": [0.0, 500, 1500, "POST /pet/{petId}/uploadImage"], "isController": false}, {"data": [0.0, 500, 1500, "GET /store/order/{orderId}"], "isController": false}, {"data": [0.0, 500, 1500, "DELETE /user/{username}"], "isController": false}, {"data": [0.0, 500, 1500, "PUT /user/{username}"], "isController": false}, {"data": [0.0, 500, 1500, "POST /pet/{petId}"], "isController": false}, {"data": [0.0, 500, 1500, "GET /store/inventory"], "isController": false}, {"data": [0.0, 500, 1500, "POST /user/createWithList"], "isController": false}, {"data": [0.0, 500, 1500, "DELETE /store/order/{orderId}"], "isController": false}, {"data": [1.0, 500, 1500, "GET /user/login"], "isController": false}, {"data": [0.0, 500, 1500, "POST /user"], "isController": false}, {"data": [0.0, 500, 1500, "GET /user/{username}"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 20, 18, 90.0, 81.94999999999999, 0, 869, 76.0, 81.60000000000001, 829.6499999999994, 869.0, 11.123470522803116, 56.372857862903224, 1.268227718298109], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["PUT /pet", 1, 1, 100.0, 82.0, 82, 82, 82.0, 82.0, 82.0, 82.0, 12.195121951219512, 534.8108803353658, 2.5247713414634143], "isController": false}, {"data": ["GET /pet/findByTags", 1, 1, 100.0, 76.0, 76, 76, 76.0, 76.0, 76.0, 76.0, 13.157894736842104, 5.872224506578948, 2.6212993421052633], "isController": false}, {"data": ["POST /store/order", 1, 1, 100.0, 76.0, 76, 76, 76.0, 76.0, 76.0, 76.0, 13.157894736842104, 5.2554481907894735, 2.8397409539473686], "isController": false}, {"data": ["POST /pet", 1, 1, 100.0, 869.0, 869, 869, 869.0, 869.0, 869.0, 869.0, 1.1507479861910241, 50.44973568757192, 0.23936457134637515], "isController": false}, {"data": ["GET /pet/findByStatus", 1, 1, 100.0, 77.0, 77, 77, 77.0, 77.0, 77.0, 77.0, 12.987012987012989, 5.8213271103896105, 2.6126217532467533], "isController": false}, {"data": ["GET /pet/{petId}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["GET /user/logout", 1, 0, 0.0, 76.0, 76, 76, 76.0, 76.0, 76.0, 76.0, 13.157894736842104, 4.959909539473684, 2.5827508223684212], "isController": false}, {"data": ["DELETE /pet/{petId}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["POST /user/createWithArray", 1, 1, 100.0, 78.0, 78, 78, 78.0, 78.0, 78.0, 78.0, 12.82051282051282, 5.49629407051282, 2.879607371794872], "isController": false}, {"data": ["POST /pet/{petId}/uploadImage", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["GET /store/order/{orderId}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["DELETE /user/{username}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["PUT /user/{username}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["POST /pet/{petId}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["GET /store/inventory", 1, 1, 100.0, 76.0, 76, 76, 76.0, 76.0, 76.0, 76.0, 13.157894736842104, 6.437602796052632, 2.6341488486842106], "isController": false}, {"data": ["POST /user/createWithList", 1, 1, 100.0, 76.0, 76, 76, 76.0, 76.0, 76.0, 76.0, 13.157894736842104, 5.2425986842105265, 2.9425370065789473], "isController": false}, {"data": ["DELETE /store/order/{orderId}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["GET /user/login", 1, 0, 0.0, 77.0, 77, 77, 77.0, 77.0, 77.0, 77.0, 12.987012987012989, 6.100344967532467, 2.5365259740259742], "isController": false}, {"data": ["POST /user", 1, 1, 100.0, 76.0, 76, 76, 76.0, 76.0, 76.0, 76.0, 13.157894736842104, 5.2425986842105265, 2.7497944078947367], "isController": false}, {"data": ["GET /user/{username}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["400/Bad Request", 7, 38.888888888888886, 35.0], "isController": false}, {"data": ["Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 48: https://petstore3.swagger.io/api/v3/store/order/{orderId}", 2, 11.11111111111111, 10.0], "isController": false}, {"data": ["Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 40: https://petstore3.swagger.io/api/v3/pet/{petId}/uploadImage", 1, 5.555555555555555, 5.0], "isController": false}, {"data": ["500/Internal Server Error", 1, 5.555555555555555, 5.0], "isController": false}, {"data": ["405/Method Not Allowed", 1, 5.555555555555555, 5.0], "isController": false}, {"data": ["Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 41: https://petstore3.swagger.io/api/v3/user/{username}", 3, 16.666666666666668, 15.0], "isController": false}, {"data": ["Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 40: https://petstore3.swagger.io/api/v3/pet/{petId}", 3, 16.666666666666668, 15.0], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 20, 18, "400/Bad Request", 7, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 41: https://petstore3.swagger.io/api/v3/user/{username}", 3, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 40: https://petstore3.swagger.io/api/v3/pet/{petId}", 3, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 48: https://petstore3.swagger.io/api/v3/store/order/{orderId}", 2, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 40: https://petstore3.swagger.io/api/v3/pet/{petId}/uploadImage", 1], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["PUT /pet", 1, 1, "400/Bad Request", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["GET /pet/findByTags", 1, 1, "400/Bad Request", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["POST /store/order", 1, 1, "400/Bad Request", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["POST /pet", 1, 1, "400/Bad Request", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["GET /pet/findByStatus", 1, 1, "400/Bad Request", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["GET /pet/{petId}", 1, 1, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 40: https://petstore3.swagger.io/api/v3/pet/{petId}", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["DELETE /pet/{petId}", 1, 1, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 40: https://petstore3.swagger.io/api/v3/pet/{petId}", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["POST /user/createWithArray", 1, 1, "405/Method Not Allowed", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["POST /pet/{petId}/uploadImage", 1, 1, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 40: https://petstore3.swagger.io/api/v3/pet/{petId}/uploadImage", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["GET /store/order/{orderId}", 1, 1, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 48: https://petstore3.swagger.io/api/v3/store/order/{orderId}", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["DELETE /user/{username}", 1, 1, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 41: https://petstore3.swagger.io/api/v3/user/{username}", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["PUT /user/{username}", 1, 1, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 41: https://petstore3.swagger.io/api/v3/user/{username}", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["POST /pet/{petId}", 1, 1, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 40: https://petstore3.swagger.io/api/v3/pet/{petId}", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["GET /store/inventory", 1, 1, "500/Internal Server Error", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["POST /user/createWithList", 1, 1, "400/Bad Request", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["DELETE /store/order/{orderId}", 1, 1, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 48: https://petstore3.swagger.io/api/v3/store/order/{orderId}", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["POST /user", 1, 1, "400/Bad Request", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["GET /user/{username}", 1, 1, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 41: https://petstore3.swagger.io/api/v3/user/{username}", 1, "", "", "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
