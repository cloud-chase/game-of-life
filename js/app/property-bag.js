define(['jquery'], function($) {
  var that = {},
    props = [],

  addDropdownUI = function($host, prop) {
    var displayName, value, index = 0,
      $select = $host.append($('<select id="' + prop.id + '"></select>')).find('select').last();

    prop.options.forEach(function(option) {
      var selected = '';
      if (option.default) {
        selected = 'selected="true"';
      }

      $select.append($('<option ' + selected + '></option>').val(index).html(option.caption));
      index += 1;
    });
    return $select;
  },
  addTextUI = function($host, prop) {
    var $input = $host.append($('<input type="text" id="' + prop.id + '" value="' + prop.initialValue + '" />')).find('input');
    return $input;
  };

  addTextareaUI = function($host, prop) {
    var $input = $host.append($('<textarea id="' + prop.id + '" cols="40" rows="5">' + prop.initialValue + '</textarea>')).find('textarea');
    return $input;
  };

  that.addTextProperty = function(id, caption, initialValue, callback) {
    props.push({id: id, type: 'text', caption: caption, initialValue: initialValue, callback: callback});
  };

  that.addTextareaProperty = function(id, caption, initialValue, callback) {
    props.push({id: id, type: 'textarea', caption: caption, initialValue: initialValue, callback: callback});
  };

  that.addDropdownProperty = function(id, caption, options, callback) {
    props.push({id: id, type: 'dropdown', caption: caption, options: options, callback: callback});
  };

  that.createUI = function($host) {
    Object.keys(props).forEach(function(key){
      var $elem;
      var prop = props[key];
      var $propEl = $host.append($('<div class="model-property"><span class="model-property-caption">' + prop.caption + ':</span>')).find('.model-property').last();
      var $propVal = $propEl.append($('<span class="model-property-value"></span>')).find('.model-property-value').last();
      switch (prop.type) {
        case 'dropdown':
          $elem = addDropdownUI($propVal, prop);
          break;
        case 'textarea':
          $elem = addTextareaUI($propVal, prop);
          break;
        default:
          $elem = addTextUI($propVal, prop);
          break;
      }
      $elem.on('change', function(e) {
        prop.callback(this.value);
      });

    });
  };

  that.init = function() {
    props = [];
  };

  return that;
});
