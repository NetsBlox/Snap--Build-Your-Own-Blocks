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

/*global modules, hex_sha512, nop, localize, utils*/

modules.cloud = '2020-September-1';

// Global stuff

var Cloud;

// Cloud /////////////////////////////////////////////////////////////

function Cloud(clientId, url, username) {
    this.clientId = clientId;
    this.username = username;
    this.projectId = null;
    this.roleId = null;
    this.url = url;
}

Cloud.prototype.clear = function () {
    this.username = null;
};

Cloud.prototype.hasProtocol = function () {
    return this.url.toLowerCase().indexOf('http') === 0;
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
    remember,  // TODO: use this...
    strategy = 'NetsBlox',
) {
    const credentials = {};
    credentials[strategy] = {username, password};
    const body = {
        credentials,
        clientId: this.clientId,
    };
    const response = await this.post('/users/login', body);
    if (response.status < 300) {
        this.username = await response.text();
    }
    // TODO: handle errors
};

Cloud.prototype.getProjectList = async function () {
    const response = await this.fetch(`/projects/user/${this.username}`);
    return await response.json();
};

Cloud.prototype.getSharedProjectList = async function() {
    const response = await this.fetch(`/projects/shared/${this.username}`);
    return await response.json();
};

Cloud.prototype.changePassword = async function (
    oldPW,
    newPW,
) {
    const body = JSON.stringify({
        username: this.username,
        password_hash: newPW,
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
    const response = await this.fetch(`/users/${this.username}`);
    return await response.json();
};

Cloud.prototype.addRole = async function(name) {
    const response = await this.post(`/projects/id/${this.projectId}/`, {name});
    // TODO: should I request the new project state, too?
    // I shouldn't have to since we should be subscribed to changes...
    //return await response.json();
};

Cloud.prototype.renameRole = async function(roleId, name) {
    const body = {
        name,
        clientId: this.clientId,
    };
    const response = await this.patch(`/projects/id/${this.projectId}/${roleId}`, body);
    // TODO: error handling
    //return await response.json();
};

Cloud.prototype.reportLatestRole = async function(id, data) {
    const options = {
        method: 'POST',
        body: JSON.stringify({id, data})
    };
    await this.fetch(`/projects/id/${this.projectId}/${this.roleId}/latest`, options);
};

Cloud.prototype.cloneRole = async function(roleId) {
    const projectId = this.projectId;
    const fetchRoleResponse = await this.fetch(`/projects/id/${projectId}/${roleId}/latest`);
    const {name, code, media} = await fetchRoleResponse.json();
    const options = {
        method: 'POST',
        body: {name, code, media}
    };
    const response = await this.post(`/projects/id/${projectId}/`, options);
    // TODO: check response code
};

Cloud.prototype.inviteOccupant = async function (username, roleId) {
    const body = {username, roleId};
    await this.post(`/network/id/${this.projectId}/occupants/invite`, body);
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
    const response = await this.fetch(`/friends/${this.username}/online`);
    return await response.json();
};

Cloud.prototype.getRole = async function (projectId, roleId) {
    const response = await this.fetch(`/projects/id/${projectId}/${roleId}/latest`);
    const project = await response.json();
    // TODO: Set the state here?
    this.setLocalState(projectId, roleId);
    return project;
};

Cloud.prototype.getProjectMetadata = async function (projectId) {
    const response = await this.fetch(`/projects/id/${projectId}/metadata`);
    const project = await response.json();
    return project;
};

Cloud.prototype.getProjectByName = async function (owner, name) {
    const response = await fetch(`/api/projects/user/${owner}/${name}`);
    // FIXME: This is returning an empty response somtimes
    const project = await response.json();
    this.setLocalState(project.ProjectID, project.RoleID);
    console.assert(project.ProjectID, 'Response does not have a project ID');
    return project;
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
    await this.fetch(`/projects/id/${this.projectId}/${roleId}`, {method});
};

Cloud.prototype.evictUser = async function(clientID) {
    const method = 'DELETE';
    await this.fetch(`/network/id/${this.projectdId}/occupants/${clientID}`, {method});
};

Cloud.prototype.saveProject = async function (roleData) {

    const url = `/projects/id/${this.projectId}/${this.roleId}`;
    const options = {
        method: 'POST',
        body: JSON.stringify(roleData),
    };
    await this.fetch(url, options);
};

Cloud.prototype.deleteProject = async function (projectId) {
    const method = 'DELETE';
    await this.fetch(`/projects/id/${projectId}`, {method});
};

Cloud.prototype.publishProject = async function (projectId) {
    const method = 'POST';
    await this.fetch(`/projects/${projectId}/publish`, {method});
};

Cloud.prototype.unpublishProject = async function (projectId) {
    const method = 'POST';
    await this.fetch(`/projects/${projectId}/unpublish`, {method});
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
    await this.fetch('/users/logout', {method});
    this.clear();
    return true;
};

Cloud.prototype.signup = async function (
    username,
    email,
) {
    const body = {
        username,
        email,
    };
    const response = await this.post('/users/create', body);
    console.assert(response.status === 200);  // TODO
};

Cloud.prototype.saveProjectCopy = async function() {
    const response = await this.fetch(`/projects/${this.projectId}/latest`);
    const xml = await response.text();
    const options = {
        method: 'POST',
        body: xml,  // TODO: add options for allow rename?
    };
    const saveResponse = await fetch(`/api/projects/`, options);

    // TODO: set the state with the network overlay
    //this.setLocalState(response.projectId, this.roleId);

    return saveResponse.status == 200;
};

Cloud.prototype.patch = async function(url, body) {
    const opts = {
        method: 'PATCH',
    };
    if (body !== undefined) {
        opts.body = JSON.stringify(body);
    }
    return await this.fetch(url, opts);
};

Cloud.prototype.post = async function(url, body) {
    const opts = {
        method: 'POST',
    };
    if (body !== undefined) {
        opts.body = JSON.stringify(body);
    }
    return await this.fetch(url, opts);
};

Cloud.prototype.fetch = async function(url, opts={}) {
    url = this.url + url;
    opts.credentials = opts.credentials || 'include';
    opts.headers = opts.headers || {};
    opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json';
    const response = await fetch(url, opts);
    if (response.status > 399) {
        const text = await response.text();
        this.onerror(text);
        throw new CloudError(text);
    }
    return response;
    // TODO: check response code and throw uniform error
};

Cloud.prototype.setLocalState = function (projectId, roleId) {
    this.projectId = projectId;
    this.roleId = roleId;
};

Cloud.prototype.resetLocalState = function () {
    this.setLocalState(null, null);
};

Cloud.prototype.newProject = function (name=localize('untitled')) {
    var myself = this;

    if (!this.newProjectRequest) {
        const saveResponse = this.post(`/projects/`, {name, clientId: this.clientId});
        this.newProjectRequest = saveResponse
            .then(response => response.json())
            .then(async result => {
                this.setClientState(result.projectId, result.roleId);
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

Cloud.prototype.setClientState = function (projectId=this.projectId, roleId=this.roleId) {
    var myself = this,
        newProjectRequest = this.newProjectRequest || Promise.resolve();

    this.projectId = projectId;
    this.roleId = roleId;
    return newProjectRequest
        .then(async () => {
            const body = {
                state: {
                    browser: {
                        projectId: this.projectId,
                        roleId: this.roleId,
                    }
                }
            };
            await this.post(`/network/${this.clientId}/state`, body);
            // Only change the project ID if no other moves/newProjects/etc have occurred
        })
        .catch(function(req) {
            var connError = 'Could not connect to ' + myself.url;
            throw new Error(req.responseText || connError);
        });
};

Cloud.prototype.setProjectName = function(name) {
    const newProjectRequest = this.newProjectRequest || Promise.resolve();


    return newProjectRequest
        .then(async () => {
            await this.patch(`/projects/id/${this.projectId}`, {name, clientId: this.clientId});
        });
};

Cloud.prototype.importProject = async function (name, role, roles) {
    const body = {
        name: name,
        roles: roles,
        clientId: this.clientId,
    };

    const response = await this.post('/projects/', body);
    return await response.json();
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

