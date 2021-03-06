var Moldy = require( '../src' ),
	should = require( 'should' );

describe( 'array of a type', function () {

	it( 'an array of booleans', function () {
		var personMoldy = Moldy.extend( 'person', {
			properties: {
				tags: {
					type: [ 'boolean' ],
					default: false
				}
			}
		} ).create();

		personMoldy.tags.push( true, false );
		personMoldy.tags.unshift( 'y', 'n' );
		personMoldy.tags.unshift( 'true' );
		personMoldy.tags.push( undefined );

		personMoldy.tags.should.eql( [ true, true, false, true, false, false ] );
		personMoldy.tags.shift();
		personMoldy.tags.should.eql( [ true, false, true, false, false ] );
	} );

	it( 'an array of numbers', function () {
		var personMoldy = Moldy.extend( 'person', {
			properties: {
				tags: {
					type: [ 'number' ],
					default: 100
				}
			}
		} ).create();

		personMoldy.tags.push( 4, 5 );
		personMoldy.tags.unshift( '2', '3' );
		personMoldy.tags.unshift( '1' );
		personMoldy.tags.push( undefined );

		personMoldy.tags.should.eql( [ 1, 2, 3, 4, 5, 100 ] );
		personMoldy.tags.shift();
		personMoldy.tags.should.eql( [ 2, 3, 4, 5, 100 ] );
	} );

	it( 'an array of objects', function () {
		var personMoldy = Moldy.extend( 'person', {
			properties: {
				tags: {
					type: [ 'object' ],
					default: {}
				}
			}
		} ).create();

		personMoldy.tags.push( '{}', '{"c":"c"}' );
		personMoldy.tags.unshift( {
			a: 'a'
		}, {
			b: 'b'
		} );
		personMoldy.tags.unshift( {} );
		personMoldy.tags.push( undefined );

		personMoldy.tags.should.eql( [ {}, {
			a: 'a'
		}, {
			b: 'b'
		}, {}, {
			c: 'c'
		}, {} ] );
		personMoldy.tags.shift();
		personMoldy.tags.should.eql( [ {
			a: 'a'
		}, {
			b: 'b'
		}, {}, {
			c: 'c'
		}, {} ] );
	} );

	it( 'an array of strings', function () {
		var personMoldy = Moldy.extend( 'person', {
			properties: {
				tags: {
					type: [ 'string' ],
					default: 'empty'
				}
			}
		} ).create();

		personMoldy.tags.push( 4, 5 );
		personMoldy.tags.unshift( 2, 3 );
		personMoldy.tags.unshift( 1 );
		personMoldy.tags.push( undefined );

		personMoldy.tags.should.eql( [ '1', '2', '3', '4', '5', 'empty' ] );
		personMoldy.tags.shift();
		personMoldy.tags.should.eql( [ '2', '3', '4', '5', 'empty' ] );
	} );

	it( 'an array of models', function () {
		var personMoldy = Moldy.extend( 'person', {
			properties: {
				tags: {
					type: [ {
						name: 'person',
						properties: {
							name: 'string',
							age: 'number'
						}
					} ],
					default: {
						name: 'Nameless',
						age: 0
					}
				}
			}
		} ).create();

		personMoldy.tags.push( {
			name: 'david',
			age: '30'
		} );

		personMoldy.tags.should.be.an.Array;
		personMoldy.tags[ 0 ].should.be.a.Moldy;
		personMoldy.tags[ 0 ].$json().should.eql( {
			id: undefined,
			name: 'david',
			age: 30
		} );

		personMoldy.tags.push( null );

		personMoldy.tags[ 1 ].should.be.an.Object;
		personMoldy.tags[ 1 ].$json().should.eql( {
			id: undefined,
			name: 'Nameless',
			age: 0
		} );

		personMoldy.tags.shift();
		personMoldy.tags.should.have.a.lengthOf( 1 );
		personMoldy.tags[ 0 ].$json().should.eql( {
			id: undefined,
			name: 'Nameless',
			age: 0
		} );

	} );

	it( 'an array of models defined directly as the value', function () {
		var personMoldy = Moldy.extend( 'person', {
			properties: {
				tags: [ {
					properties: {
						name: 'string',
						age: 'number'
					}
				} ]
			}
		} ).create();

		personMoldy.tags.push( {
			name: 'david',
			age: '30'
		} );

		personMoldy.tags.should.be.an.Array;
		personMoldy.tags[ 0 ].should.be.a.Moldy;
		personMoldy.tags[ 0 ].$json().should.eql( {
			id: undefined,
			name: 'david',
			age: 30
		} );

		personMoldy.tags.push( null );

		personMoldy.tags[ 1 ].should.be.an.Object;
		personMoldy.tags[ 1 ].$json().should.eql( {
			id: undefined,
			name: null,
			age: null
		} );

		personMoldy.tags.shift();
		personMoldy.tags.should.have.a.lengthOf( 1 );
		personMoldy.tags[ 0 ].$json().should.eql( {
			id: undefined,
			name: null,
			age: null
		} );

	} );

	it( 'should handle an array of a type when given JSON to $data', function () {
		var personMoldy = Moldy.extend( 'person', {
			properties: {
				name: 'string',
				guests: [ {
					keyless: true,
					properties: {
						name: 'string',
						age: 'number'
					}
				} ]
			}
		} ).create();

		personMoldy.$data( {
			name: 100,
			guests: [ {
				name: 'David',
				age: '30'
			}, {
				name: 'Glen',
				age: '20'
			} ]
		} );

		personMoldy.guests[ 0 ].should.be.a.Moldy;
		personMoldy.guests[ 1 ].should.be.a.Moldy;

		personMoldy.guests.push( {
			age: '10'
		} );

		personMoldy.$json().should.eql( {
			id: undefined,
			name: '100',
			guests: [ {
				name: 'David',
				age: 30
			}, {
				name: 'Glen',
				age: 20
			}, {
				name: null,
				age: 10
			} ]
		} );

	} );

	it( 'should handle an array of a model with an optional object', function () {
		var personMoldy = Moldy.extend( 'person', {
			properties: {
				name: 'string',
				guests: [ {
					keyless: true,
					properties: {
						name: 'string',
						age: 'number',
						address: {
							type: 'object',
							optional: true
						}
					}
				} ]
			}
		} ).create();

		personMoldy.guests.push( {
			name: 'david'
		} );

		personMoldy.$json().should.eql( {
			id: undefined,
			name: null,
			guests: [ {
				name: 'david',
				age: null
			} ]
		} );

		personMoldy.$json().should.eql( {
			id: undefined,
			name: null,
			guests: [ {
				name: 'david',
				age: null
			} ]
		} );

		personMoldy.guests.push( {
			name: 'max',
			address: {
				suburb: 'warner',
				country: 'australia'
			}
		} );

		personMoldy.$json().should.eql( {
			id: undefined,
			name: null,
			guests: [ {
				name: 'david',
				age: null
			}, {
				name: 'max',
				age: null,
				address: {
					suburb: 'warner',
					country: 'australia'
				}
			} ]
		} );

	} );

	it( 'should handle an array being passed in through the `create` property', function () {
		var PersonMoldy = Moldy.extend( 'person', {
			keyless: true,
			properties: {
				placeholders: [ {
					keyless: true,
					properties: {
						name: {
							type: 'string',
							values: [ 'body', 'title' ],
							default: ''
						}
					}
				} ]
			}
		} );

		var personMoldy = PersonMoldy.create( {
			'placeholders': [ {
				'name': 'body'
			}, {
				'name': 'title'
			} ]
		} );

		personMoldy.placeholders.should.have.a.lengthOf( 2 );
	} );

	it( 'should handle an array being passed in through the `create` property deconstructed and reconstructed', function () {
		var PersonMoldy = Moldy.extend( 'person', {
			keyless: true,
			properties: {
				placeholders: {
					default: [],
					type: [ {
						keyless: true,
						properties: {
							name: {
								type: 'string',
								default: ''
							}
						}
					} ]
				}
			}
		} );

		var personMoldy = PersonMoldy.create( {
			'placeholders': [ {
				'name': 'body1'
			}, {
				'name': 'body2'
			}, {
				'name': 'body3'
			} ]
		} );

		var personMoldyJson = personMoldy.$json();

		var personMoldyReconstructed = PersonMoldy.create( personMoldyJson );

		personMoldyReconstructed.placeholders.should.have.a.lengthOf( 3 );
		personMoldyReconstructed.placeholders[ 0 ].name.should.eql( 'body1' );
		personMoldyReconstructed.placeholders[ 1 ].name.should.eql( 'body2' );
		personMoldyReconstructed.placeholders[ 2 ].name.should.eql( 'body3' );
	} );

	it( 'should handle an array of a type using $data defaulting to merge the array', function () {
		var PersonMoldy = Moldy.extend( 'person', {
			keyless: true,
			properties: {
				placeholders: {
					default: [],
					type: [ {
						keyless: true,
						properties: {
							name: {
								type: 'string',
								default: ''
							}
						}
					} ]
				}
			}
		} );

		var personMoldy = PersonMoldy.create( {
			'placeholders': [ {
				'name': 'body1'
			}, {
				'name': 'body2'
			}, {
				'name': 'body3'
			} ]
		} );

		personMoldy.$data( {
			'placeholders': [ {
				'name': 'body4'
			} ]
		} );

		personMoldy.placeholders.should.have.a.lengthOf( 4 );
		personMoldy.placeholders[ 0 ].name.should.eql( 'body1' );
		personMoldy.placeholders[ 1 ].name.should.eql( 'body2' );
		personMoldy.placeholders[ 2 ].name.should.eql( 'body3' );
		personMoldy.placeholders[ 3 ].name.should.eql( 'body4' );
	} );

	it( 'should handle an array of a type using $data defaulting to merge the array', function () {
		var PersonMoldy = Moldy.extend( 'person', {
			keyless: true,
			properties: {
				placeholders: {
					default: [],
					type: [ {
						keyless: true,
						properties: {
							name: {
								type: 'string',
								default: ''
							}
						}
					} ]
				}
			}
		} );

		var personMoldy = PersonMoldy.create( {
			'placeholders': [ {
				'name': 'body1'
			}, {
				'name': 'body2'
			}, {
				'name': 'body3'
			} ]
		} );

		personMoldy.$data( {
			'placeholders': [ {
				'name': 'body4'
			} ]
		}, {
			mergeArrayOfAType: false
		} );

		personMoldy.placeholders.should.have.a.lengthOf( 1 );
		personMoldy.placeholders[ 0 ].name.should.eql( 'body4' );
	} );

} );