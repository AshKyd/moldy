var is = require( 'sc-is' ),
	cast = require( 'sc-cast' ),
	hasKey = require( 'sc-haskey' ),
	helpers = require( './helpers' ),
	merge = require( 'sc-merge' ),
	emitter = require( 'emitter-component' ),
	useify = require( 'sc-useify' ),
	request = require( './request' );

var Model = function ( _name, _properties ) {
	var self = this,
		properties = is.an.object( _properties ) ? _properties : {};

	Object.defineProperties( self, {
		__model: {
			value: true
		},
		__attributes: {
			value: {},
			writable: true
		},
		__baseUrl: {
			value: cast( properties[ 'baseUrl' ], 'string', '' ),
			writable: true
		},
		__data: {
			value: {},
			writable: true
		},
		__destroyed: {
			value: false,
			writable: true
		},
		__headers: {
			value: cast( properties[ 'headers' ], 'object', {} ),
			writable: true
		},
		__key: {
			value: cast( properties[ 'key' ], 'string', 'id' ) || 'id',
			writable: true
		},
		__keyless: {
			value: properties[ 'keyless' ] === true
		},
		__name: {
			value: _name || ''
		},
		__url: {
			value: cast( properties[ 'url' ], 'string', '' ),
			writable: true
		},
		busy: {
			value: false,
			writable: true
		}
	} );

	if ( !properties[ 'keyless' ] ) {
		self.$property( self.__key );
	}

	Object.keys( cast( properties[ 'properties' ], 'object', {} ) ).forEach( function ( _key ) {
		self.$property( _key, properties[ 'properties' ][ _key ] );
	} );

	self.on( 'presave', helpers.setBusy( self ) );
	self.on( 'save', helpers.unsetBusy( self ) );

	self.on( 'predestroy', helpers.setBusy( self ) );
	self.on( 'destroy', helpers.unsetBusy( self ) );

	self.on( 'preget', helpers.setBusy( self ) );
	self.on( 'get', helpers.unsetBusy( self ) );

};

Model.prototype.$baseUrl = function ( _base ) {
	var self = this,
		url = cast( _base, 'string', self.__baseUrl || '' );

	self.__baseUrl = url.trim().replace( /(\/|\s)+$/g, '' );

	return is.not.a.string( _base ) ? self.__baseUrl : self;
};

Model.prototype.$collection = function ( _query ) {
	var self = this,
		url = self.$url(),
		method = 'get',
		query = is.an.object( _query ) ? _query : {},
		callback = is.a.func( _query ) ? _query : is.a.func( _callback ) ? _callback : helpers.noop;

	self.emit( 'precollection', {
		model: self,
		method: method,
		query: query,
		url: url,
		callback: callback
	} );

	request( self, query, method, url, function ( _error, _res ) {
		self.emit( 'collection', _error, _res );
		callback.apply( self, arguments );
	} );

};

Model.prototype.$destroy = function ( _callback ) {
	var self = this,
		isDirty = self.$isDirty(),
		data = self.$json(),
		url = self.$url() + ( self.__keyless ? '' : '/' + self[ self.__key ] ),
		method = 'delete',
		callback = is.a.func( _callback ) ? _callback : helpers.noop;

	self.emit( 'predestroy', {
		model: self,
		data: data,
		method: method,
		url: url,
		callback: callback
	} );

	if ( !isDirty ) {
		request( self, data, method, url, function () {

			self.emit( 'destroy', self );

			self.__destroyed = true;
			callback.apply( self, arguments );
		} );
	} else {
		callback.apply( self, [ new Error( 'This model cannot be destroyed because it has not been saved to the server yet.' ) ] );
	}

};

Model.prototype.$data = function ( _data ) {
	var self = this,
		data = is.object( _data ) ? _data : {};

	Object.keys( data ).forEach( function ( _key ) {
		if ( self.__attributes.hasOwnProperty( _key ) ) {
			self[ _key ] = data[ _key ];
		}
	} );

	return self;
};

Model.prototype.$clone = function ( _data ) {
	var self = this,
		data = cast( _data, 'object', {} ),
		newModel = new Model( self.__name, {
			baseUrl: self.__baseUrl,
			headers: self.__headers,
			key: self.__key,
			keyless: self.__keyless,
			url: self.__url
		} );

	Object.keys( self.__attributes ).forEach( function ( _propertyKey ) {
		newModel.$property( _propertyKey, merge( self.__attributes[ _propertyKey ] ) );
		newModel[ _propertyKey ] = data[ _propertyKey ]
	} );

	return newModel;
};

Model.prototype.$get = function ( _query, _callback ) {
	var self = this,
		url = self.$url(),
		method = 'get',
		query = is.an.object( _query ) ? _query : {},
		callback = is.a.func( _query ) ? _query : is.a.func( _callback ) ? _callback : helpers.noop;

	self.emit( 'preget', {
		model: self,
		method: method,
		query: query,
		url: url,
		callback: callback
	} );

	request( self, query, method, url, function ( _error, _res ) {
		self.emit( 'get', _error, _res );
		callback.apply( self, arguments );
	} );

};

Model.prototype.$headers = function ( _headers ) {
	this.__headers = is.an.object( _headers ) ? _headers : this.__headers;
	return is.not.an.object( _headers ) ? this.__headers : this;
};

Model.prototype.$isDirty = function () {
	return is.empty( this[ this.__key ] );
};

Model.prototype.$isValid = function () {
	var self = this,
		isValid = true;

	Object.keys( self.__attributes ).forEach( function ( _key ) {

		if ( self.$isDirty() && _key === self.__key ) {
			return;
		}

		var value = self[ _key ],
			attributes = self.__attributes[ _key ],
			type = attributes.type,
			isRequired = attributes.optional ? false : true,
			hasNoDefault = is.nullOrUndefined( attributes[ 'default' ] ),
			isNullOrUndefined = self.__keyless ? false : is.nullOrUndefined( value ),
			typeIsWrong = is.not.empty( type ) ? is.not.a[ type ]( value ) : isNullOrUndefined;

		if ( isRequired && typeIsWrong ) {
			isValid = false;
		}

	} );

	return isValid;
};

Model.prototype.$json = function () {
	var data = this.__data,
		json = {};

	Object.keys( data ).forEach( function ( _key ) {
		if ( is.not.an.object( data[ _key ] ) ) {
			json[ _key ] = data[ _key ];
		} else if ( data[ _key ] instanceof Model ) {
			json[ _key ] = data[ _key ].$json();
		}
	} );

	return json;
};

Model.prototype.$property = function ( _key, _value ) {
	var self = this,
		attributes = new helpers.attributes( _key, _value ),
		existingValue = self[ _key ];

	if ( !self.hasOwnProperty( _key ) || !self.__attributes.hasOwnProperty( _key ) ) {

		if ( attributes.type === 'model' ) {
			Object.defineProperty( self, _key, {
				enumerable: true,
				value: attributes[ 'default' ]
			} );
			self.__data[ _key ] = self[ _key ];
		} else {
			Object.defineProperty( self, _key, {
				get: helpers.getProperty( _key ),
				set: helpers.setProperty( _key ),
				enumerable: true
			} );
		}
		self.__attributes[ _key ] = attributes;
	}

	if ( existingValue !== undefined ) {
		self[ _key ] = existingValue;
	} else if ( is.empty( self[ _key ] ) && attributes.optional === false && is.not.nullOrUndefined( attributes[ 'default' ] ) ) {
		self[ _key ] = attributes[ 'default' ];
	} else if ( is.empty( self[ _key ] ) && attributes.optional === false ) {
		self.__data[ _key ] = is.empty( attributes.type ) ? undefined : cast( undefined, attributes.type );
	}

	return self;
};

Model.prototype.$save = function ( _callback ) {
	var self = this,
		error = null,
		isDirty = self.$isDirty(),
		data = self.$json(),
		url = self.$url() + ( !isDirty && !self.__keyless ? '/' + self[ self.__key ] : '' ),
		method = isDirty ? 'post' : 'put',
		callback = is.a.func( _callback ) ? _callback : helpers.noop;

	self.emit( 'presave', {
		model: self,
		data: data,
		method: method,
		url: url,
		callback: callback
	} );

	request( self, data, method, url, function ( _error, _res ) {
		self.emit( 'save', _error, _res );
		callback.apply( self, arguments );
	} );

};

Model.prototype.$url = function ( _url ) {
	var self = this,
		base = is.empty( self.__baseUrl ) ? '' : self.__baseUrl,
		name = is.empty( self.__name ) ? '' : '/' + self.__name.trim().replace( /^\//, '' ),
		url = _url || self.__url || '',
		endpoint = base + name + ( is.empty( url ) ? '' : '/' + url.trim().replace( /^\//, '' ) );

	self.__url = url.trim().replace( /^\//, '' );

	return is.not.a.string( _url ) ? endpoint : self;
};

emitter( Model.prototype );
useify( Model );

module.exports = Model;