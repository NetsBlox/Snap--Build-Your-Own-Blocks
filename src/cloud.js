/*

    cloud.js

    a backend API for SNAP!

    written by Jens Mönig

    Copyright (C) 2015 by Jens Mönig

    This file is part of Snap!.

    Snap! is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of
    the License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

// Global settings /////////////////////////////////////////////////////

/*global modules, hex_sha512, nop, localize, CLIENT_ID, SERVER_URL, utils*/

modules.cloud = '2020-September-1';

// Global stuff

var Cloud;
var SnapCloud = new Cloud(CLIENT_ID, SERVER_URL + '/api/');

// Cloud /////////////////////////////////////////////////////////////

function Cloud(clientId, url) {
    this.clientId = clientId;
    this.roleId = null;
    this.username = null;
    this.password = null; // hex_sha512 hashed
    this.url = url;
    this.session = null;
    this.limo = null;
    this.route = null;
    this.api = null;
}

Cloud.prototype.clear = function () {
    this.username = null;
    this.password = null;
    this.session = null;
    this.limo = null;
    this.route = null;
    this.api = null;
};

Cloud.prototype.hasProtocol = function () {
    return this.url.toLowerCase().indexOf('http') === 0;
};

Cloud.prototype.setRoute = function (username) {
    var routes = 20,
        userNum = 0,
        i;

    for (i = 0; i < username.length; i += 1) {
        userNum += username.charCodeAt(i);
    }
    userNum = userNum % routes + 1;
    this.route = '.sc1m' +
        (userNum < 10 ? '0' : '') +
        userNum;
};

// Cloud: Snap! API

Cloud.prototype.getPublicProject = async function (
    id,
) {
    // id is Username=username&projectName=projectname,
    // where the values are url-component encoded
    // callBack is a single argument function, errorCall take two args
    const deferred = utils.defer();
    const request = new XMLHttpRequest();

    try {
        request.open(
            "GET",
            (this.hasProtocol() ? '' : 'http://')
                + this.url + 'RawPublic'
                + '?'
                + id,
            true
        );
        request.setRequestHeader(
            "Content-Type",
            "application/x-www-form-urlencoded"
        );
        request.withCredentials = true;
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                if (request.responseText) {
                    if (request.responseText.indexOf('ERROR') === 0) {
                        deferred.reject(new Error(request.responseText));
                    } else {
                        deferred.resolve(request.responseText);
                    }
                } else {
                    deferred.reject(new Error(localize('could not connect to:') + this.url));
                }
            }
        };
        request.send(null);
    } catch (err) {
        deferred.reject(err);
    }
    return deferred.promise;
};

Cloud.prototype.resetPassword = async function (username) {
    const response = await fetch(`/api/users/${username}/password`, {method: 'POST'});
    return await response.text();
};

Cloud.prototype.login = async function (
    username,
    password,
    remember,
    strategy,
) {
    const body = JSON.stringify({
        username: username,
        password_hash: hex_sha512(password),
    });
    const response = await fetch(`/api/users/login`, {method: 'POST', body});
    // TODO: handle other strategies?
    // TODO: handle "remember" argument?
    return await response.text();
};

Cloud.prototype.getProjectList = async function () {
    const response = await fetch(`/api/users/${this.username}/projects`);
    return await response.json();
};

Cloud.prototype.getSharedProjectList = async function() {
    const response = await fetch(`/api/users/${this.username}/projects/shared`);
    return await response.json();
};

Cloud.prototype.changePassword = async function (
    oldPW,
    newPW,
) {
    const body = JSON.stringify({
        username: this.username,
        password_hash: hex_sha512(newPW),
    });
    const response = await fetch(
        `/api/users/${this.username}/password`,
        {method: 'PATCH', body}
    );
    return await response.text();
};

Cloud.prototype.parseSnapResponse = function (src) {
    var ans = [],
        lines;
    if (!src) {return ans; }
    lines = src.split(" ");
    lines.forEach(function (service) {
        var entries = service.split("&"),
            dict = {};
        entries.forEach(function (entry) {
            var pair = entry.split("="),
                key = decodeURIComponent(pair[0]),
                val = decodeURIComponent(pair[1]);
            dict[key] = val;
        });
        ans.push(dict);
    });
    return ans;
};

Cloud.prototype.parseDict = function (src) {
    var dict = {};
    if (!src) {return dict; }
    src.split("&").forEach(function (entry) {
        var pair = entry.split("="),
            key = decodeURIComponent(pair[0]),
            val = decodeURIComponent(pair[1]);
        dict[key] = val;
    });
    return dict;
};

Cloud.prototype.encodeDict = function (dict) {
    var str = '',
        pair,
        key;
    if (!dict) {return null; }
    for (key in dict) {
        if (dict.hasOwnProperty(key)) {
            pair = encodeURIComponent(key)
                + '='
                + encodeURIComponent(dict[key]);
            if (str.length > 0) {
                str += '&';
            }
            str += pair;
        }
    }
    return str;
};

Cloud.prototype.getUserData = async function() {
    const response = await fetch(`/api/users/${this.username}`);
    return await response.json();
};

Cloud.prototype.addRole = async function(name) {
    const options = {
        method: 'POST',
        body: JSON.stringify({name})
    };
    const response = await fetch(`/api/projects/id/${this.projectId}/`, options);
    // TODO: should I request the new project state, too?
    // I shouldn't have to since we should be subscribed to changes...
    return await response.json();
};

Cloud.prototype.renameRole = async function(roleId, name) {
    const options = {
        method: 'PATCH',
        body: JSON.stringify({name})
    };
    const response = await fetch(`/api/projects/id/${this.projectId}/${roleId}`, options);
    return await response.json();
};

Cloud.prototype.cloneRole = async function(roleId) {
    const xmlResponse = await fetch(`/api/projects/id/${this.projectId}/${roleId}/latest`);
    const data = await xmlResponse.text();
    const options = {
        method: 'POST',
        body: JSON.stringify({name, data})
    };
    const response = await fetch(`/api/projects/${this.projectId}/${roleId}`, options);
    // TODO: check response code
    return await response.json();
};

Cloud.prototype.inviteGuest = async function (username, roleId) {
    const options = {
        method: 'POST',
        body: JSON.stringify({username, roleId})
    };
    const response = await fetch(`/api/projects/${this.projectId}/occupants/invite`, options);
    return await response.json();
};

Cloud.prototype.inviteToCollaborate = async function (username) {
    const options = {
        method: 'POST',
        body: JSON.stringify({
            sender: this.username,
            projectId: this.projectId,
        })
    };
    const response = await fetch(`/api/collaboration-invites/${username}`, options);
    return await response.json();
};

Cloud.prototype.respondToCollaborationInvite = async function (id, accepted) {
    const options = {
        method: 'POST',
        body: JSON.stringify({
            response: accepted
        })
    };
    const response = await fetch(`/api/collaboration-invites/${this.username}/${id}`, options);
    return await response.json();
};

Cloud.prototype.addCollaborator = async function (projectId, username) {
    const options = {
        method: 'POST',
        body: JSON.stringify({
            username
        })
    };
    const response = await fetch(`/api/projects/${projectId}/collaborators/`, options);
    return await response.json();
};

Cloud.prototype.joinActiveProject = async function (projectId) {
    const response = await fetch(`/api/projects/${projectId}/occupants`);
    const state = await response.json();
    // TODO: get the least occupied role ID
    // TODO: open that role
};

Cloud.prototype.evictCollaborator = async function (id, projectId) {
    const options = {
        method: 'DELETE',
    };
    const response = await fetch(`/api/projects/${projectId}/${id}`, options);
    return await response.json();
};

Cloud.prototype.getFriendList = async function () {
    const response = await fetch(`/api/friends/${this.username}/online`);
    return await response.json();
};

Cloud.prototype.getProject = function (projectId, roleId) {
    var myself = this,
        args = [id];

    if (roleId) {
        args.push(roleId);
    }
    // TODO: retrieve the given project/role metadata and source code.
    // if no role is provided, default to the most recently edited one

    this.reconnect(
        function () {
            myself.callService(
                'getProject',
                function (response) {
                    var xml = response[0];
                    myself.setLocalState(xml.ProjectID, xml.RoleID);
                    callBack(xml);
                },
                errorCall,
                args
            );
        },
        errorCall
    );
};

Cloud.prototype.getProjectByName = function (owner, name, callBack, errorCall) {
    var myself = this;
    // TODO

    this.reconnect(
        function () {
            myself.callService(
                'getProjectByName',
                function (response) {
                    var xml = response[0];
                    myself.setLocalState(xml.ProjectID, xml.RoleID);
                    callBack(xml);
                },
                errorCall,
                [owner, name]
            );
        },
        errorCall
    );
};

Cloud.prototype.getCollaboratorList = async function () {
    const [friends, collaborators] = Promise.all(
        [
            fetch(`/api/friends/${this.username}/`),
            fetch(`/api/projects/${this.projectId}/collaborators`)
        ]
        .map(responseP => responseP.then(response => response.json()))
    );
    return friends.map(username => ({
        username,
        collaborating: collaborators.includes(username),
    }));
};

Cloud.prototype.deleteRole = async function(roleId) {
    const method = 'DELETE';
    const response = await fetch(`/api/projects/${this.projectdId}/${roleId}`, {method});
    return response.status === 200;
};

Cloud.prototype.evictUser = async function(clientID) {
    const method = 'DELETE';
    const response = await fetch(`/api/projects/${this.projectdId}/occupants/${clientID}`, {method});
    return response.status === 200;
};

Cloud.prototype.saveProject = async function (roleData) {

    const url = `/api/projects/${this.projectId}/${this.roleId}`;
    const options = {
        method: 'POST',
        body: JSON.stringify(roleData),
    };
    const response = await fetch(url, options);
    return response.status === 200;
    //myself.reconnect(
        //function () {
            //myself.callService(
                //'saveProject',
                //function (response, url) {
                    //myself.setLocalState(response.projectId, response.roleId);
                    //callBack.call(null, response, url);
                //},
                //errorCall,
                //[
                    //myself.roleId,
                    //ide.projectName,
                    //name || ide.room.name,
                    //SnapCloud.projectId,
                    //ide.room.ownerId,
                    //overwrite === true,
                    //serialized.SourceCode,
                    //serialized.Media
                //]
            //);
        //},
        //errorCall
    //);
};

Cloud.prototype.deleteProject = async function (projectId) {
    const method = 'DELETE';
    const response = await fetch(`/api/projects/${projectId}`, {method});
    return response.status == 200;
};

Cloud.prototype.publishProject = async function (projectId) {
    const method = 'DELETE';
    const response = await fetch(`/api/projects/${projectId}`, {method});
    return response.status == 200;
};

Cloud.prototype.reconnect = function (callback, errorCall) {
    if (!this.username) {
        this.message('You are not logged in');
        return;
    }

    // need to set 'api' from setClientState
    let promise = this.setClientState();
    if (callback && errorCall) {
        promise = promise.then(callback)
            .catch(errorCall);
    }
    return promise;
};

Cloud.prototype.disconnect = nop;

Cloud.prototype.logout = async function () {
    const method = 'POST';
    const response = await fetch('/api/users/logout', {method});
    if (response.status == 200) {
        this.clear();
        return true;
    }
    return false;
};

Cloud.prototype.signup = function (
    username,
    email,
    callBack,
    errorCall
) {
    // both callBack and errorCall are two-argument functions
    var request = new XMLHttpRequest(),
        myself = this,
        data = 'Username=' + encodeURIComponent(username) + '&Email=' +
            encodeURIComponent(email);
    try {
        request.open(
            'POST',
            (this.hasProtocol() ? '' : 'http://')
                + this.url + 'SignUp',
            true
        );
        request.setRequestHeader(
            'Content-Type',
            'application/x-www-form-urlencoded'
        );
        request.withCredentials = true;
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                if (request.responseText) {
                    if (request.responseText.indexOf('ERROR') === 0) {
                        errorCall.call(
                            this,
                            request.responseText,
                            'Signup'
                        );
                    } else {
                        callBack.call(
                            null,
                            request.responseText,
                            'Signup'
                        );
                    }
                } else {
                    errorCall.call(
                        null,
                        myself.url + 'SignUp',
                        localize('could not connect to:')
                    );
                }
            }
        };
        request.send(data);
    } catch (err) {
        errorCall.call(this, err.toString(), 'NetsBlox Cloud');
    }
};

Cloud.prototype.saveProjectCopy = async function() {
    const response = await fetch(`/api/projects/${this.projectId}/latest`);
    const xml = await response.text();
    const options = {
        method: 'POST',
        body: xml,  // TODO: add options for allow rename?
    };
    const saveResponse = await fetch(`/api/projects/?allow_rename=true`, options);

    // TODO: set the state with the network overlay
    //this.setLocalState(response.projectId, this.roleId);

    return saveResponse.status == 200;
};

Cloud.prototype.request = function (url, dict) {
    var resolve,
        reject,
        promise = new Promise(function(res, rej) {
            resolve = res;
            reject = rej;
        }),
        data = JSON.stringify(dict);

    url = SERVER_URL + url;
    var request = new XMLHttpRequest();

    request.open('POST', url, true);
    request.setRequestHeader(
        'Content-Type',
        'application/json'
    );
    request.withCredentials = true;
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            var badStatusCode = request.status > 299 || request.status < 200;
            if (badStatusCode || request.responseText &&
                    request.responseText.indexOf('ERROR') === 0) {
                return reject(request);
            }
            resolve(JSON.parse(request.responseText));
        }
    };

    request.send(data);
    return promise;
};

Cloud.prototype.setLocalState = function (projectId, roleId) {
    this.projectId = projectId;
    this.roleId = roleId;
};

Cloud.prototype.resetLocalState = function () {
    var baseId = this.clientId + '-' + Date.now();
    var projectId = 'tmp-project-id-' + baseId;
    var roleId = 'tmp-role-id-' + baseId;
    this.setLocalState(projectId, roleId);
};

Cloud.prototype.newProject = function (name) {
    var myself = this;

    if (!this.newProjectRequest) {
        // TODO: use the name argument
        const saveResponse = fetch(`/api/projects/?allow_rename=true`, {method: 'POST'});
        this.newProjectRequest = saveResponse
            .then(response => response.json())
            .then(function(result) {
                myself.setLocalState(result.projectId, result.roleId);
                myself.newProjectRequest = null;
                return result;
            })
            .catch(function(req) {
                myself.resetLocalState();
                myself.newProjectRequest = null;
                throw new Error(req.responseText);
            });
    }

    return this.newProjectRequest;
};

Cloud.prototype.getClientState = function () {
    return {
        username: this.username,
        clientId: this.clientId,
        projectId: this.projectId,
        roleId: this.roleId
    };
};

Cloud.prototype.setClientState = function (room, role, actionId) {
    var myself = this,
        newProjectRequest = this.newProjectRequest || Promise.resolve();

    return newProjectRequest
        .then(function() {
            var data = {
                __u: myself.username,
                __h: myself.password,
                clientId: myself.clientId,
                socketId: myself.clientId,
                projectId: myself.projectId,
                roleId: myself.roleId,
                roomName: room,
                roleName: role,
                actionId: actionId
            };
            return myself.request('/api/setClientState', data);
        })
        .then(function(result) {
            // Only change the project ID if no other moves/newProjects/etc have occurred
            myself.setLocalState(result.projectId, result.roleId);
            if (!myself.api) {  // Set the api, if available...
                myself.api = result.api;
            }

            return result;
        })
        .catch(function(req) {
            var connError = 'Could not connect to ' + myself.url;
            throw new Error(req.responseText || connError);
        });
};

Cloud.prototype.setProjectName = function(name) {
    var myself = this,
        newProjectRequest = this.newProjectRequest || Promise.resolve();

    return newProjectRequest
        .then(function() {
            var data = {
                projectId: myself.projectId,
                name: name
            };
            return myself.request('/api/setProjectName', data);
        })
        .then(function(result) {
            return result;
        })
        .catch(function(req) {
            var connError = 'Could not connect to ' + myself.url;
            throw new Error(req.responseText || connError);
        });
};

Cloud.prototype.importProject = function (name, role, roles) {
    var myself = this,
        data = {
            projectId: this.projectId,
            clientId: this.clientId,
            name: name,
            role: role,
            roles: roles
        };

    return this.request('/api/importProject', data)
        .then(function(result) {
            myself.setLocalState(result.projectId, result.roleId);
            return result.state;
        })
        .catch(function(req) {
            myself.resetLocalState();
            throw new Error(req.responseText);
        });
};

Cloud.prototype.getEntireProject = function(projectId, callback, errorCall) {
    var myself = this;
    this.reconnect(
        function () {
            myself.callService(
                'getEntireProject',
                function (response) {
                    callback(response);
                    myself.disconnect();
                },
                errorCall,
                [
                    projectId
                ]
            );
        },
        errorCall
    );
};

Cloud.prototype.linkAccount = async function(username, password, type) {
    await this.request(`/api/v2/link/${this.username}/${type}`, {username, password});
};

Cloud.prototype.unlinkAccount = async function(account) {
    await this.request(`/api/v2/unlink/${this.username}`, account);
};

Cloud.prototype.exportProject = async function(projectId=this.projectId) {
    const response = await fetch(`/api/v2/projects/${projectId}/latest?clientId=${this.clientId}`);
    return await response.text();
};

Cloud.prototype.exportRole = async function(projectId=this.projectId, roleId=this.roleId) {
    const response = await fetch(`/api/v2/projects/${projectId}/${roleId}/latest?clientId=${this.clientId}`);
    return await response.text();
};

// Cloud: user messages (to be overridden)

Cloud.prototype.message = function (string) {
    alert(string);
};

class CloudError extends Error {
    constructor(label, message) {
        super(message);
        this.label = label;
    }
}

