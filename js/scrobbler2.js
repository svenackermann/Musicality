/**
 * Copyright 2014 Kyle Kamperschroer (http://kylek.me)
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
**/

function Scrobbler(){
	this.logger = Logger.getInstance();
	this.key = "00fd800a7549fca4a235f69bf977fcf1";
	// Don't steal my keys, please!
	this.secret = "1ba52c5a7ff76be423d90b874434c126";
	this.lastFmUrl = "http://ws.audioscrobbler.com/2.0/";
	this.authUrl = "http://www.last.fm/api/auth/";
	this.sessionKey = undefined;
	this.username = undefined;

}

Scrobbler.prototype.AuthenticateWithLastFm = function(){
	
}
