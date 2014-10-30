'use strict';

var fake = (function () {
  var recipeData, fakeIdSerial, makeFakeId, mockSio;

  fakeIdSerial = 6;

  makeFakeId = function () {
    return 'rid' + String(fakeIdSerial++);
  };

  mockSio = (function () {
    var
      on_sio, emit_sio, rval,
      callback_map = {};

    rval = function (x) {
      return csbc.deepClone({
        content: "chat" + x,
        author: "author" + x,
        date: new Date(2014, 10, x)
      });
    };

    on_sio = function (msg_type, callback) {
      callback_map[msg_type] = callback;
    };

    emit_sio = function (msg_type, data) {
      var person_map, i;

      if (msg_type === 'csbindSendtest' && callback_map.csbindReceivetest) {
        if (data.mode !== 'check') {
          callback_map.csbindReceivetest(data);
        }
      }

      if (msg_type === 'checktest' && callback_map.csbindReceivetest) {
        callback_map.csbindReceivetest({
          mode: 'changeAll',
          values: [rval(5), rval(6)]
        });
      }

    };

    return {
      emit: emit_sio,
      on: on_sio
    };
  }());

  return {
    mockSio: mockSio
  };
}());
