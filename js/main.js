(function () {
    window.appState = new State();
    var defaultState = {
        year: 2013,
        question1: 3,
        question2: 7,
        minLinkValue: 10,
        splitMultipleAnswers: true
    };
    var dataFiles = {
        2012: {
            location: './data/JavaScript%20Developer%20Survey%202012.csv',
            settings: {
                answerDelimiter: ', '
            }
        },
        2013: {
            location: './data/JavaScript%20Developer%20Survey%202013.csv',
            settings: {
                answerDelimiter: ';'
            }
        }
    };

    var surveyData = new SurveyDataProvider();
    var sankeyDiagram = new SankeyDiagram();

    //*******************
    // DATA -> VIEW
    //*******************
    appState.on('change', function (change, state) {
        if (change.year) {
            var dataFile = dataFiles[state.year];
            surveyData = new SurveyDataProvider(dataFile.settings);

            $('#disabled-while-loading').addClass('disabled');

            surveyData
                .loadData(dataFile.location)
                .done(function () {
                    $('#disabled-while-loading').removeClass('disabled');

                    updateURL();
                    updateQuestions();
                    updateInputs();
                    updateDiagram();
                });
        } else if ((change.questions || change.minLinkValue || change.splitMultipleAnswers) && state.question1 && state.question2) {
            updateURL();
            updateInputs();
            updateDiagram();
        }
    });

    function buildListOfQuestions(questions) {
        var root = document.createDocumentFragment();
        var option = document.createElement('option');

        questions.forEach(function (q, idx) {
            option = option.cloneNode(false);
            option.setAttribute('value', idx + 1);
            option.innerHTML = q;
            root.appendChild(option);
        });

        return root;
    }

    function updateQuestions() {
        var listOfQuestions = buildListOfQuestions(surveyData.getQuestions());

        $questionSelect1.find('option:gt(0)').remove();
        $questionSelect2.find('option:gt(0)').remove();

        $questionSelect2.append(listOfQuestions.cloneNode(true));
        $questionSelect1.append(listOfQuestions);
    }

    function updateInputs() {
        $questionSelect1.off('change', onQuestionChange);
        $questionSelect1.data('selectpicker').val(appState.get('question1'));
        $questionSelect1.on('change', onQuestionChange);

        $questionSelect2.off('change', onQuestionChange);
        $questionSelect2.data('selectpicker').val(appState.get('question2'));
        $questionSelect2.on('change', onQuestionChange);

        $('input[name=surveyYear]').off('change', onYearChange);
        $('input[name=surveyYear][value=' + appState.get('year') + ']').data('radio').toggle();
        $('input[name=surveyYear]').on('change', onYearChange);

        $slider.data('uiSlider').options['change'] = undefined;
        $slider.data('uiSlider').value(appState.get('minLinkValue'));
        $("#sliderValue").text(appState.get('minLinkValue'));
        $slider.data('uiSlider').options['change'] = onMinLinkValueChange;

        $splitMultipleAnswers.off('change', onSplitMultipleAnswersChange);
        $splitMultipleAnswers.data('checkbox').setCheck(appState.get('splitMultipleAnswers') ? 'check' : 'uncheck');
        $splitMultipleAnswers.on('change', onSplitMultipleAnswersChange);
    }

    function updateURL() {
        history.pushState(
            appState.get(),
            undefined,
            '#' + appState.get('year') + '/'
                + appState.get('question1') + '/'
                + appState.get('question2') + '/'
                + appState.get('minLinkValue') + '/'
                + (appState.get('splitMultipleAnswers') ? 'true' : 'false')
        );
    }

    function updateDiagram() {
        var data = surveyData.getValuesForQuestions(
            appState.get('question1'),
            appState.get('question2'),
            appState.get('splitMultipleAnswers')
        );
        sankeyDiagram.draw(data, appState.get('minLinkValue'));
    }

    //*******************
    // VIEW -> DATA
    //*******************
    var $questionSelect1 = $('#questions-1');
    var $questionSelect2 = $('#questions-2');
    var $slider = $("#slider").slider({
        min: 2,
        max: 200,
        value: 10,
        range: "min"
    });
    var $splitMultipleAnswers = $('#splitMultipleAnswers');

    function onMinLinkValueChange() {
            var value = $slider.data('uiSlider').value();

            $("#sliderValue").text(value);
            appState.change({
                minLinkValue: value
            });
    }

    $slider.data('uiSlider').options['change'] = onMinLinkValueChange;
    $("#sliderValue").text($slider.data('uiSlider').value());

    function onQuestionChange() {
        appState.change({
            question1: $questionSelect1.val(),
            question2: $questionSelect2.val()
        });
    }

    $($questionSelect1).selectpicker().on('change', onQuestionChange);
    $($questionSelect2).selectpicker().on('change', onQuestionChange);

    function onYearChange() {
        if ($(this).is(':checked')) {
            appState.change({
                question1: -1,
                question2: -1,
                year: $(this).val()
            });
        }
    }

    $('input[name=surveyYear]').on('change', onYearChange);

    function onSplitMultipleAnswersChange() {
        appState.change({
            splitMultipleAnswers: $(this).is(':checked')
        });
    }

    $splitMultipleAnswers.on('change', onSplitMultipleAnswersChange);

    window.addEventListener('popstate', function () {
        var hash = location.hash;
        var q1, q2, year, minLinkValue, splitMultipleAnswers;

        if (history.state) {
            year = history.state.year;
            q1 = history.state.question1;
            q2 = history.state.question2;
            minLinkValue = history.state.minLinkValue;
            splitMultipleAnswers = history.state.splitMultipleAnswers;
        } else if (hash && hash.length > 0) {
            hash = hash.slice(1).split('/');

            if (hash.length === 5) {
                year = hash[0];
                q1 = hash[1];
                q2 = hash[2];
                minLinkValue = hash[3];
                splitMultipleAnswers = (hash[4] === 'true');
            }
        }

        if (q1 !== undefined && q2 !== undefined && year !== undefined) {
            appState.change({
                question1: q1,
                question2: q2,
                year: year,
                minLinkValue: minLinkValue,
                splitMultipleAnswers: splitMultipleAnswers
            });
        } else {
            appState.change(defaultState);
        }
    }, false);

    if (location.hash === "") {
        appState.change(defaultState);
    }
})();