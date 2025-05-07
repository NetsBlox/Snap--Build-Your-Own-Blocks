NetsBlox (client source code)

https://netsblox.org

An extension of Snap providing networking capabilities, collaborative editing and comprehensive undo/logging support.

For a deployment ready version of NetsBlox, check out the [main repo](https://github.com/netsblox/netsblox).

## Quick Start

If you need to make changes only to the client side of netsblox if it is a change that is generic and everyone could benefit from [fork us and make a pull request](https://github.com/NetsBlox/Snap--Build-Your-Own-Blocks/pulls).
Otherwise, you can always host the NetsBlox client and point it to our server. This way you can still:
1. communicate with other users on main NetsBlox server
2. use our server deployment so you don't have to setup and maintain your own
3. have access to all the services already available and configured on NetsBlox.

To host your own client files, first install dependencies:

```
cd utils
npm i
cd -
```

Next, the cloud client needs to be (optionally updated via git and) built:

```
cd src/cloud
npm i
npm run build
cd -
```

Then return to the project root and start the file server with
```
node utils/serve.js
```

## New Releases

To create a new release, first begin by performing the setup steps in the previous section.
You will also need to install `google-closure-compiler` globally.

```
npm i -g google-closure-compiler
```

Afterwards, you will need to update the NetsBlox version numbers in `index.dot` and `src/store-ext.js` to the soon-to-be-released version.

Next, to create the release files, run the following command.
Despite the name, `minify.js` will automatically build required files before minifying them.

```
node utils/minify.js
```

You can then commit the updated files in `dist/` and open a PR.
After merging, you can create a new release on github, which will automatically publish a new dockerhub version.
Afterwards, simply pull and restart browser in the NetsBlox server.

## Contact

For questions about netsblox, feel free to make an issue or reach out to:
- Akos Ledeczi at akos.ledeczi@vanderbilt.edu
- Brian Broll at brian.broll@vanderbilt.edu

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

Want to use NetsBlox but scared by the open-source license? Get in touch with us,
we'll make it work.

Snap! is Copyright (C) 2008-2025 by Jens Mönig and Brian Harvey
NetsBlox is Copyright (C) 2025 Vanderbilt University
