(function () {
    function SurveyDataProvider(options) {
        var defaults = {
            answerDelimiter: ';'
        };

        this.settings = $.extend({}, defaults, options);
    }

    SurveyDataProvider.prototype.loadData = function (dataFile) {
        var dfd = new jQuery.Deferred();

        d3.text(dataFile, "text/csv", function (text) {
            if (text) {
                this.answers = d3.csv.parseRows(text);

                //separate questions from answers
                this.questions = this.answers.shift();
                //remove first column (timestamp)
                this.questions.shift();

                dfd.resolve();
            } else {
                dfd.reject();
            }
        }.bind(this));

        return dfd.promise();
    };

    SurveyDataProvider.prototype.getQuestions = function () {
        return this.questions;
    };

    SurveyDataProvider.prototype.getValuesForQuestions = function (questionIdx1, questionIdx2, splitMultipleAnswers) {
        var nodes = [], links = [], nodesDict = {}, linksDict = {},
            row, ans1, ans2, ans1Arr, ans2Arr;

        splitMultipleAnswers = (splitMultipleAnswers === false) ? false : true;

        function addNodeToDictionary(prefix, answer) {
            nodes.push({
                name: answer
            });

            var ans1Idx = nodes.length - 1;
            nodesDict[prefix + answer] = ans1Idx;

            return ans1Idx;
        }

        function addLinkToDictionary(ans1, ans2) {
            var ans1Idx = nodesDict['q1 - ' + ans1],
                ans2Idx = nodesDict['q2 - ' + ans2],
                linkName;

            if (ans1Idx === undefined) {
                ans1Idx = addNodeToDictionary('q1 - ', ans1);
            }
            if (ans2Idx === undefined) {
                ans2Idx = addNodeToDictionary('q2 - ', ans2);
            }

            linkName = ans1 + ' - ' + ans2;
            if (linksDict[linkName]) {
                linksDict[linkName].value++;
            } else {
                linksDict[linkName] = {
                    source: ans1Idx,
                    target: ans2Idx,
                    value: 1
                };
            }
        }

        for (var i = 0, l = this.answers.length; i < l; i++) {
            row = this.answers[i];
            ans1 = row[questionIdx1];
            ans2 = row[questionIdx2];

            if (!ans1 || !ans2) {
                continue;
            }

            //some questions have multiple answers
            if(splitMultipleAnswers === true) {
                ans1Arr = ans1.split(this.settings.answerDelimiter);
                ans2Arr = ans2.split(this.settings.answerDelimiter);

                ans1Arr.forEach(function (ans1ArrItem) {
                    ans2Arr.forEach(function (ans2ArrItem) {
                        addLinkToDictionary(ans1ArrItem, ans2ArrItem);
                    });
                });
            } else {
                addLinkToDictionary(ans1, ans2);
            }
        }

        //convert dictionary to an array
        for (var link in linksDict) {
            if (linksDict.hasOwnProperty(link)) {
                links.push(linksDict[link]);
            }
        }

        return {
            nodes: nodes,
            links: links
        };
    };

    window.SurveyDataProvider = SurveyDataProvider;
})();