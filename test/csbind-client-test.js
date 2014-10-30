'use strict';

describe('csbind-client test', function () {

  var testData, socket, necKeys, rval;

  beforeEach(function () {

    rval = function (x) {
      return csbc.deepClone({
        content: "chat" + x,
        author: "author" + x,
        date: new Date(2014, 10, x)
      });
    };

    testData = [{
      content: "chat1",
      author: "author1",
      date: new Date(1)
    }, {
      content: "chat2",
      author: "author2",
      date: new Date(2)
    }, {
      content: "chat3",
      author: "author3",
      date: new Date(3)
    }];
  });

  describe('deepClone test', function () {
    it("Clone equals original.", function () {
      expect(testData).toEqual(csbc.deepClone(testData));
    });

    it("Clone equals original.", function () {
      expect(_.isEqual(testData, csbc.deepClone(testData))).toBe(true);
    });
  });

  describe('observable test with socketIO', function () {

    var funcs, fs, val;

    beforeEach(function () {

      socket = fake.mockSio;

      necKeys = ['content', 'author', 'date'];

      funcs = {
        update: function (data) {
          console.log('update called' + data);
        },

        receive: function (event, setReceived) {
          socket.on(event, function (data) {
            setReceived(data);
          });
        },

        send: function (event, data) {
          socket.emit(event, data);
        },

        get: function () {
          return testData;
        },

        err: function (e) {
          console.log('error: ' + e);
        }
      };

      fs = {
        receive: funcs.receive,
        send: funcs.send
      };

      val = {
        content: "chat4",
        author: "author4",
        date: new Date(),
        callback: function () {
          console.log("4");
        }
      };

      spyOn(funcs, "update").and.callThrough();
      spyOn(funcs, "receive").and.callThrough();
      spyOn(funcs, "send").and.callThrough();
      spyOn(funcs, "get").and.callThrough();
      spyOn(funcs, "err").and.callThrough();
    });

    describe('observal関数のテスト', function () {

      it("observable関数を呼び出したとき引数を3つセットしなければいけない。", function () {
        expect(function () {
          csbc.observable();
        }).toThrow();
      });

      it("observable関数を呼び出したとき第一引数はStringでないといけない。", function () {
        csbc.observable(0, fs, necKeys, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("observable関数を呼び出したとき第二引数のハッシュの値は関数でないといけない。", function () {
        csbc.observable('test', {
          receive: ['test'],
          send: ['test']
        }, necKeys, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("observable関数を呼び出したとき第二引数のハッシュのプロパティはsendとreceiveでないといけない。", function () {
        csbc.observable('test', {
          receive: funcs.send,
          sends: funcs.receive
        }, necKeys, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("observable関数を呼び出したとき第三引数はstringの配列でないといけない。", function () {
        csbc.observable('test', fs, [0, '0'], funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("observable関数を呼び出したとき第四引数を登録する場合は関数でないといけない。", function () {
        expect(function () {
          csbc.observable('test', fs, necKeys, ['test']);
        }).toThrow();
      });

      it("observable関数を呼び出したとき、第四引数に関数が登録されていてエラーが起きると、その関数が呼ばれる。", function () {
        csbc.observable(0, fs, necKeys, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("observable関数を呼び出したとき、登録した関数はまだ呼ばれない。", function () {
        csbc.observable('test', fs, necKeys, funcs.err);
        expect(funcs.send).not.toHaveBeenCalled();
        expect(funcs.receive).not.toHaveBeenCalled();
        expect(funcs.err).not.toHaveBeenCalled();
      });

    });

    describe("start関数のテスト", function () {

      it("start関数には引数が必要である。", function () {
        expect(function () {
          csbc.observable('test', fs, necKeys).start();
        }).toThrow();
      });

      it("start関数には2つ目の引数は任意である。", function () {
        csbc.observable('test', fs, necKeys).start(funcs.get);
        expect(funcs.err).not.toHaveBeenCalled();
      });

      it("start関数を呼び出したとき第一引数の値は登録したキーを持つオブジェクトの配列かそれを返す関数でないといけない。", function () {
        csbc.observable('test', fs, necKeys, funcs.err).start([{
          test: 'test'
        }], funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("start関数を呼び出したとき第一引数の値は関数の場合、登録したキーを持つオブジェクトの配列を返す関数でないといけない。", function () {
        csbc.observable('test', fs, necKeys, funcs.err).start(function () {
          return [{
            test: 'test'
          }];
        }, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("start関数を呼び出したとき第二引数の値は関数でないといけない。", function () {
        expect(function () {
          csbc.observable('test', {
            receive: funcs.receive,
            send: funcs.send
          }, necKeys).start(testData, 0);
        }).toThrow();
      });

      it("start関数を呼び出したとき、処理の途中でエラーが投げられた場合、第二引数の関数が呼ばれる。", function () {
        funcs.receive = function () {
          throw new Error('receive');
        };
        csbc.observable('test', {
          receive: funcs.receive,
          send: funcs.send
        }, necKeys).start(testData, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

    });

    describe("set関数のテスト", function () {

      it("set関数には引数が必要である。", function () {
        expect(function () {
          csbc.observable('test', fs, necKeys).start(testData, funcs.err).set();
        }).toThrow();
      });

      it("set関数を呼び出したとき第一引数の値はオブジェクトでないといけない。", function () {
        csbc.observable('test', fs, necKeys).start(testData).set(['test'], funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("set関数を呼び出したとき第一引数のオブジェクトのプロパティはindex,values,modeでないといけない。", function () {
        csbc.observable('test', fs, necKeys).start(testData).set({
          index: 0,
          valuess: [val],
          mode: 'add'
        }, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("set関数を呼び出したとき第二引数は関数でないといけない。", function () {
        expect(function () {
          csbc.observable('test', fs, necKeys).start(testData).set({
            index: 0,
            values: [val],
            mode: 'add'
          }, 'test');
        }).toThrow();
      });

      it("set関数を呼び出したとき、処理の途中でエラーが投げられた場合、第二引数の関数が呼ばれる。", function () {
        funcs.send = function () {
          throw new Error('send');
        };
        csbc.observable('test', {
          receive: funcs.receive,
          send: funcs.send
        }, necKeys).start(testData).set({
          index: 0,
          values: [val],
          mode: 'edit'
        }, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("set関数を呼び出したとき第一引数のオブジェクトのmodeプロパティはinsert,add,remove,editのいずれかでないといけない。", function () {
        csbc.observable('test', fs, necKeys).start(testData).set({
          index: 0,
          values: [val],
          mode: 'adds'
        }, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("set関数でaddを呼び出したとき第一引数のオブジェクトのindexプロパティは必要ない。", function () {
        csbc.observable('test', fs, necKeys).start(testData).set({
          values: [val],
          mode: 'add'
        }, funcs.err);
        expect(funcs.err).not.toHaveBeenCalled();
      });

      it("set関数でaddを呼び出したとき第一引数のオブジェクトのvalueプロパティが必要である。", function () {
        csbc.observable('test', fs, necKeys).start(testData).set({
          index: -1,
          valuess: [val],
          mode: 'add'
        }, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("set関数でeditを呼び出したとき第一引数のオブジェクトのindexプロパティが必要である。", function () {
        csbc.observable('test', fs, necKeys).start(testData).set({
          values: [val],
          mode: 'edit'
        }, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("set関数でeditを呼び出したとき第一引数のオブジェクトのvaluesプロパティが必要である。", function () {
        csbc.observable('test', fs, necKeys).start(testData).set({
          index: 0,
          mode: 'edit'
        }, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("set関数でinsertを呼び出したとき第一引数のオブジェクトのindexプロパティが必要である。", function () {
        csbc.observable('test', fs, necKeys).start(testData).set({
          values: [val],
          mode: 'insert'
        }, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("set関数でinsertを呼び出したとき第一引数のオブジェクトのvaluesプロパティが必要である。", function () {
        csbc.observable('test', fs, necKeys).start(testData).set({
          index: 0,
          mode: 'insert'
        }, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("set関数でremoveを呼び出したとき第一引数のオブジェクトのindexプロパティが必要である。", function () {
        csbc.observable('test', fs, necKeys).start(testData).set({
          values: [val],
          mode: 'remove'
        }, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("set関数でremoveを呼び出したとき第一引数のオブジェクトのvaluesプロパティは省略可能である。", function () {
        csbc.observable('test', fs, necKeys).start(testData).set({
          index: 0,
          mode: 'remove'
        }, funcs.err);
        expect(funcs.err).not.toHaveBeenCalled();
      });

      it("set関数を呼び出したとき第一引数のオブジェクトのindexプロパティは数字である必要がある。", function () {
        csbc.observable('test', fs, necKeys).start(testData).set({
          values: [val],
          index: 'test',
          mode: 'insert'
        }, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("set関数を呼び出したとき第一引数のオブジェクトのindexプロパティは0以上である必要がある。", function () {
        csbc.observable('test', fs, necKeys).start(testData).set({
          values: [val],
          index: -1,
          mode: 'insert'
        }, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("set関数を呼び出したとき第一引数のオブジェクトのindexプロパティは現在のデータのlengthまでである必要がある。", function () {
        csbc.observable('test', fs, necKeys).start(testData).set({
          values: [val],
          index: 4,
          mode: 'insert'
        }, funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("set関数を呼び出したときsend関数がイベント名とデータが引数として呼び出される。", function () {
        var chkData = {
          values: [val, val],
          index: 3,
          mode: 'insert',
          id: 5
        };
        var chk = {};
        funcs.send = (function () {
          return function (eventName, data) {
            chk = {
              event: eventName,
              data: data
            };
          };
        })();
        csbc.observable('test', {
          send: funcs.send,
          receive: funcs.receive
        }, necKeys).start(testData).set({
          values: [val, val],
          index: 3,
          mode: 'insert',
          id: 5
        }, funcs.err);
        expect(_.isEqual(chkData, chk.data)).toBeTruthy();
        expect(_.isEqual('csbindSendtest', chk.event)).toBeTruthy();
        expect(funcs.err).not.toHaveBeenCalled();
      });

    });

    describe("_setReceived関数、get関数、addUpdate関数のテスト", function () {

      var chk;

      beforeEach(function () {
        chk = {
          newValues: undefined,
          data: undefined
        };
        funcs.update = (function () {
          return function (newValues, data) {
            chk = {
              newValues: newValues,
              data: data
            };
          };
        })();
        spyOn(funcs, "update").and.callThrough();
      });

      it("addUpdates関数には引数が必要である。", function () {
        var obs = csbc.observable('test', fs, necKeys).start([rval(0), rval(1), rval(2)]);

        expect(function () {
          obs.addUpdates();
        }).toThrow();
      });

      it("addUpdates関数の第一引数は関数の配列である必要がある。", function () {
        var obs = csbc.observable('test', fs, necKeys).start([rval(0), rval(1), rval(2)]);
        obs.addUpdates([1, 2], funcs.err);
        expect(funcs.err).toHaveBeenCalled();
      });

      it("addUpdates関数の第二引数は関数である必要がある。", function () {
        expect(function () {
          csbc.observable('test', fs, necKeys).start([rval(0), rval(1), rval(2)]).addUpdates([funcs.update], 0);
        }).toThrow();
      });

      it("_setReceivedが呼ばれると登録しているupdate関数と_check関数が呼ばれる。", function () {
        var obs = csbc.observable('test', {
          send:funcs.send,
          receive:funcs.receive
        }, necKeys).start([rval(0), rval(1), rval(2)]);

        obs.addUpdates([funcs.update, funcs.update]);

        obs.set({
          values: [val],
          index: 0,
          mode: 'insert'
        });
        expect(_.isEqual([val, rval(0), rval(1), rval(2)], chk.newValues)).toBeTruthy();
        expect(_.isEqual({
          values: [val],
          index: 0,
          mode: 'insert'
        }, chk.data)).toBeTruthy();
        expect(funcs.update.calls.count()).toBe(2);
        expect(funcs.send.calls.count()).toBe(2);
      });

      it("_setReceivedが呼ばれても、値に変化がなければ登録しているupdate関数は呼ばれない。", function () {
        var obs = csbc.observable('test', {
          send:funcs.send,
          receive:funcs.receive
        }, necKeys).start([rval(0), rval(1), rval(2)]);

        obs.addUpdates([funcs.update, funcs.update]);

        obs.set({
          values: [],
          index: 0,
          mode: 'insert'
        });
        expect(_.isEqual([rval(0), rval(1), rval(2)], obs.get())).toBeTruthy();
        expect(_.isEqual(undefined, chk.newValues)).toBeTruthy();
        expect(_.isEqual(undefined, chk.data)).toBeTruthy();
        expect(funcs.update.calls.count()).toBe(0);
        expect(funcs.send.calls.count()).toBe(1);
      });

      it("set関数でinsertするとき複数の値を挿入できる。", function () {
        var obs = csbc.observable('test', fs, necKeys).start([rval(0), rval(1), rval(2)]);

        obs.addUpdates([funcs.update, funcs.update]);

        obs.set({
          values: [val, val],
          index: 2,
          mode: 'insert'
        });
        expect(_.isEqual([rval(0), rval(1), val, val, rval(2)], chk.newValues)).toBeTruthy();
        expect(_.isEqual({
          values: [val, val],
          index: 2,
          mode: 'insert'
        }, chk.data)).toBeTruthy();
        expect(_.isEqual([rval(0), rval(1), val, val, rval(2)], obs.get())).toBeTruthy();
        expect(funcs.update.calls.count()).toBe(2);
      });

      it("set関数でaddするとき複数の値を追加できる。", function () {
        var obs = csbc.observable('test', fs, necKeys).start([rval(0), rval(1), rval(2)]);

        obs.addUpdates([funcs.update, funcs.update]);

        obs.set({
          values: [val, val],
          mode: 'add'
        });
        expect(_.isEqual([rval(0), rval(1), rval(2), val, val], chk.newValues)).toBeTruthy();
        expect(_.isEqual({
          values: [val, val],
          mode: 'add'
        }, chk.data)).toBeTruthy();
        expect(_.isEqual([rval(0), rval(1), rval(2), val, val], obs.get())).toBeTruthy();
        expect(funcs.update.calls.count()).toBe(2);
      });

      it("set関数でeditするとき複数の値を編集できる。", function () {
        var obs = csbc.observable('test', fs, necKeys).start([rval(0), rval(1), rval(2)]).addUpdates([funcs.update, funcs.update]).set({
          values: [val, val],
          mode: 'edit',
          index:1
        });
        expect(_.isEqual([rval(0), val, val], chk.newValues)).toBeTruthy();
        expect(_.isEqual({
          values: [val, val],
          mode: 'edit',
          index: 1
        }, chk.data)).toBeTruthy();
        expect(_.isEqual([rval(0), val, val], obs.get())).toBeTruthy();
        expect(funcs.update.calls.count()).toBe(2);
      });

      it("set関数でremoveすると指定した値を編集できる。", function () {
        var obs = csbc.observable('test', fs, necKeys).start([rval(0), rval(1), rval(2)]).addUpdates([funcs.update, funcs.update]).set({
          mode: 'remove',
          index:1
        });
        expect(_.isEqual([rval(0), rval(2)], chk.newValues)).toBeTruthy();
        expect(_.isEqual({
          mode: 'remove',
          index: 1
        }, chk.data)).toBeTruthy();
        expect(_.isEqual([rval(0), rval(2)], obs.get())).toBeTruthy();
        expect(funcs.update.calls.count()).toBe(2);
      });

      it("_setReceive関数でcheckAllされると値がすべて変更される。", function () {
        var obs = csbc.observable('test', {
          send: funcs.send,
          receive: funcs.receive
        }, necKeys).start([rval(0), rval(1), rval(2)]).addUpdates([funcs.update, funcs.update]);
        socket.emit('checktest');
        expect(_.isEqual([rval(5), rval(6)], chk.newValues)).toBeTruthy();
        expect(_.isEqual({
          mode: 'changeAll',
          values: [rval(5), rval(6)]
        }, chk.data)).toBeTruthy();
        expect(_.isEqual([rval(5), rval(6)], obs.get())).toBeTruthy();
        expect(funcs.update.calls.count()).toBe(2);
        expect(funcs.send.calls.count()).toBe(1);
      });

    });

  });

});
