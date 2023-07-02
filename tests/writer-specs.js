let should = require('should');

describe('when transforming mongo db metrics', function() {
	let result, secondResult;

	let serverStatus = require('./serverStatus.json');
	let metricMap = {
		connections: { current: "gauge", available: "gauge" },
		backgroundFlushing: { last_ms: "gauge" },
		asserts: { user: "counter" }
	};

	let server = {
		cluster: 'muppet',
		host: 'muppet.prod.app.com'
	};

	let config = {
		graphiteKeyTemplateGauges: 'test.databases.<%= cluster %>.<%= host %>.gauges.<%= metric %>',
		graphiteKeyTemplateCounters: 'test.databases.<%= cluster %>.<%= host %>.counters.<%= metric %>.count'
	};

	let writer = require('../lib/writer')(config);
	let RQ = require('../rq');

	before(function(done) {
		done();
	});

	describe('without short hostname default', function() {

		before(function(done) {
			writer.toGraphiteMetricsArray(server, metricMap)
				(function(success, failure) {
					result = success;

					serverStatus.asserts.user = 1053 + 10;
					writer.toGraphiteMetricsArray(server, metricMap, result)
						(function (success2, failure2) {
							secondResult = success2;
							done();
						}, serverStatus);
				}, serverStatus);
		});

		it('should transform to array with flat key value', function(done) {
			result.keyValues['test.databases.muppet.muppet_prod_app_com.gauges.connections_current'].should.equal(145);
			result.keyValues['test.databases.muppet.muppet_prod_app_com.gauges.backgroundFlushing_last_ms'].should.equal(25);
			done();
		});

		it('should only send counter deltas', function(done) {
			result.keyValues['test.databases.muppet.muppet_prod_app_com.counters.asserts_user.count'].should.equal(0);
			secondResult.keyValues['test.databases.muppet.muppet_prod_app_com.counters.asserts_user.count'].should.equal(10);
			done();
		});
	});


	describe('with short hostname default', function() {

		before(function(done) {
			server.shortName = "shorty";
			let func = writer.toGraphiteMetricsArray(server, metricMap);

			func(function(success, failure) {
				result = success;
				done();
			}, serverStatus);
		});


		it('should use shortname instead of host', function(done) {
			result.keyValues['test.databases.muppet.shorty.gauges.connections_current'].should.equal(145);
			result.keyValues['test.databases.muppet.shorty.gauges.backgroundFlushing_last_ms'].should.equal(25);
			done();
		});

	});

});
