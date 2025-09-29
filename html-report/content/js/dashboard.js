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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 20, 18, 90.0, 240.45, 0, 1947, 283.0, 302.20000000000005, 1864.8499999999988, 1947.0, 4.0708324852432325, 20.759456734683493, 0.45757111235497655], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["PUT /pet", 1, 1, 100.0, 304.0, 304, 304, 304.0, 304.0, 304.0, 304.0, 3.289473684210526, 144.23249897203948, 0.67138671875], "isController": false}, {"data": ["GET /pet/findByTags", 1, 1, 100.0, 283.0, 283, 283, 283.0, 283.0, 283.0, 283.0, 3.5335689045936394, 1.5769931537102475, 0.6936009275618376], "isController": false}, {"data": ["POST /store/order", 1, 1, 100.0, 283.0, 283, 283, 283.0, 283.0, 283.0, 283.0, 3.5335689045936394, 1.4113571113074206, 0.7522636925795053], "isController": false}, {"data": ["POST /pet", 1, 1, 100.0, 1947.0, 1947, 1947, 1947.0, 1947.0, 1947.0, 1947.0, 0.5136106831022086, 22.521126251926038, 0.10533031587057011], "isController": false}, {"data": ["GET /pet/findByStatus", 1, 1, 100.0, 286.0, 286, 286, 286.0, 286.0, 286.0, 286.0, 3.4965034965034967, 1.567280375874126, 0.6931545017482518], "isController": false}, {"data": ["GET /pet/{petId}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["GET /user/logout", 1, 0, 0.0, 286.0, 286, 286, 286.0, 286.0, 286.0, 286.0, 3.4965034965034967, 1.3180179195804196, 0.6760817307692308], "isController": false}, {"data": ["DELETE /pet/{petId}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["POST /user/createWithArray", 1, 1, 100.0, 283.0, 283, 283, 283.0, 283.0, 283.0, 283.0, 3.5335689045936394, 1.5148796378091873, 0.7833204505300354], "isController": false}, {"data": ["POST /pet/{petId}/uploadImage", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["GET /store/order/{orderId}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["DELETE /user/{username}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["PUT /user/{username}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["POST /pet/{petId}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["GET /store/inventory", 1, 1, 100.0, 284.0, 284, 284, 284.0, 284.0, 284.0, 284.0, 3.5211267605633805, 1.722738776408451, 0.6945972711267606], "isController": false}, {"data": ["POST /user/createWithList", 1, 1, 100.0, 284.0, 284, 284, 284.0, 284.0, 284.0, 284.0, 3.5211267605633805, 1.402948943661972, 0.7771236795774649], "isController": false}, {"data": ["DELETE /store/order/{orderId}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["GET /user/login", 1, 0, 0.0, 284.0, 284, 284, 284.0, 284.0, 284.0, 284.0, 3.5211267605633805, 1.6539667693661972, 0.6774042693661972], "isController": false}, {"data": ["POST /user", 1, 1, 100.0, 285.0, 285, 285, 285.0, 285.0, 285.0, 285.0, 3.5087719298245617, 1.398026315789474, 0.7229989035087719], "isController": false}, {"data": ["GET /user/{username}", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}]}, function(index, item){
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
