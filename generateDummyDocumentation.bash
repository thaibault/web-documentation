#!/bin/bash --login

# region vim modline

# vim: set tabstop=4 shiftwidth=4 expandtab:
# vim: foldmethod=marker foldmarker=region,endregion:

# endregion

# region header

# Copyright Torben Sickert 16.12.2012

# License
#    This library written by Torben Sickert stand under a creative commons
#    naming 3.0 unported license.
#    see http://creativecommons.org/licenses/by/3.0/deed.de

# endregion

# Prints a dummy documentation content.
function printDummyDocumentationContent() {
    cat << EOF
<h1 id="content">
    Content<!--deDE:Inhalt-->
</h1>
<div class="toc">
    <ul>
        <li>
            <a href="#content">Content<!--deDE:Inhalt--></a>
        </li>
        <li>
            <a href="#getting-in">Getting in<!--deDE:Einstieg--></a>
            <ul>
                <li><a href="#a">a</a></li>
                <li><a href="#b">b</a></li>
            </ul>
        </li>
        <li><a href="#c">c</a>
        <ul>
            <li>
                <a href="#d">d</a>
                <ul><li><a href="#e">e</a></li></ul>
            </li>
        </ul>
    </ul>
</div>
<h1 id="getting-in"><langReplace>Getting <code>inline code</code>in</langReplace><!--deDE:Einstieg<code>inline code</code>--></h1>
<p>
    Lorem ipsum dolor sit amet...
</p>
<h2 id="a">a</h2>
<p>
    Lorem ipsum dolor sit amet...
</p>
<h2 id="b">b</h2>
<p>
    Lorem ipsum dolor sit amet...
</p>
<h1 id="c">c</h1>
<p>
    Lorem ipsum dolor sit amet...
</p>
<h2 id="d">d</h2>
<p>
    Lorem ipsum dolor sit amet...
</p>
<div class="codehilite">
    <pre>&gt;&gt;&gt; /path/to/boostNode/runnable/macro.py -p /path/to/boostNode -e py</pre>
</div>
<div class="codehilite">
    <pre>&gt;&gt;&gt; /path/to/boostNode/runnable/macro.py -p /path/to/boostNode -e py --looooooooong options -shorter</pre>
</div>

<!--showExample-->
<table class=codehilitetable>
    <tr>
        <td class=linenos>
            <div class=linenodiv>
                <pre> 1
 2
 3</pre>
            </div>
        </td>
        <td class=code>
            <div class=codehilite>
                <pre><span class="nt">&lt;form</span> <span class="na">method=</span><span class="s">&quot;get&quot;</span> <span class="na">action=</span><span class="s">&quot;#&quot;</span><span class="nt">&gt;</span>
    <span class="nt">&lt;input</span> <span class="na">class=</span><span class="s">&quot;form-control&quot;</span> <span class="na">type=</span><span class="s">&quot;text&quot;</span> <span class="na">name=</span><span class="s">&quot;test&quot;</span> <span class="na">value=</span><span class="s">&quot;4&quot;</span> <span class="nt">/&gt;</span>
<span class="nt">&lt;/form&gt;</span>
</pre>
            </div>
        </td>
    </tr>
</table>
<p>
    Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet.Lorem ipsum dolor
    sit amet. Lorem ipsum dolor sit amet. sit amet. Lorem ipsum dolor sit amet.
    sit amet. Lorem ipsum dolor sit amet. sit amet. Lorem ipsum dolor sit amet.
    sit amet. Lorem ipsum dolor sit amet...
</p>
<!--showExample-->
<div class="codehilite">
    <pre>&lt;p&gt;test text&lt;/p&gt;</pre>
</div>
<p>
    Lorem ipsum dolor sit amet...
</p>
<!--showExample:js-->
<div class="codehilite">
    <pre>window.test = 5 * 2;</pre>
</div>
<p>
    Lorem ipsum dolor sit amet...
</p>
<!--showExample:css-->
<div class="codehilite">
    <pre>border: 0px solid black;</pre>
</div>
<p>
    Lorem ipsum dolor sit amet...
</p>
<table class="codehilitetable">
    <tbody>
        <tr>
            <td class="linenos">
                <div class="linenodiv">
                    <pre> 10
 11
 12
 100
 111
 999</pre>
                </div>
            </td>
            <td class="code">
                <div class="codehilite">
                    <pre><span class="err">#</span><span class="o">!</span><span class="err">/usr/bin/env javaScript</span>

<span class="kd">var</span> <span class="nx">tools</span> <span class="o">=</span> <span class="nx">jQuery</span><span class="p">.</span><span class="nx">Tools</span><span class="p">({</span><span class="s1">&#39;logging&#39;</span><span class="o">:</span> <span class="kc">true</span><span class="p">});</span><span class="kd">var</span> <span class="nx">tools</span> <span class="o">=</span> <span class="nx">jQuery</span><span class="p">.</span><span class="nx">Tools</span><span class="p">({</span><span class="s1">&#39;logging&#39;</span><span class="o">:</span> <span class="kc">true</span><span class="p">});</span>
<span class="c1">// An 79 chars comment: mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm</span>
<span class="nx">tools</span><span class="p">.</span><span class="nx">log</span><span class="p">(</span><span class="s1">&#39;test&#39;</span><span class="p">);</span>
<span class="nx">tools</span><span class="p">.</span><span class="nx">log</span><span class="p">(</span><span class="s1">&#39;test&#39;</span><span class="p">);</span>
</pre>
                </div>
            </td>
        </tr>
    </tbody>
</table>
<h3 id="e">e</h3>

<table class=codehilitetable><tr><td class=linenos><div class=linenodiv><pre> 1
 2
 3
 4
 5
 6
 7
 8
 9
10
11
12
13
14
15
16
17
18</pre></div></td><td class=code><div class=codehilite><pre>
<span class="c">#!/usr/bin/env bash</span>

cat <span class="s">&lt;&lt; EOF</span>
<span class="s">Usage: $0 &lt;initramfsFilePath&gt; [options]</span>

<span class="s">$__NAME__ installs an arch linux into an initramfs file.</span>

<span class="s">Option descriptions:</span>

<span class="s">\$(installArchLinuxPrintCommandLineOptionDescriptions &quot;\$@&quot; | \</span>
<span class="s">    sed &#39;/^ *-[a-z] --output-system .*$/,/^$/d&#39;)</span>
<span class="s">EOF</span>

<span class="nv">myTarget</span><span class="o">=</span><span class="k">\$(</span>mktemp<span class="k">)</span>

installArchLinux <span class="s2">&quot;\$@&quot;</span> --output-system <span class="nv">\$myTarget</span>

<span class="c"># test...</span>
</pre></div></td></tr></table>
<p>
    Lorem ipsum dolor sit amet...
</p>
EOF
    }

for render_file_path in index.html.tpl coffeeScript/main.coffee.tpl; do
    template "$render_file_path" --scope-variables \
        TAGLINE='tagline' NAME='productName' LANGUAGE='en' LANGUAGES='' \
        GOOGLE_TRACKING_CODE='google_traking_code' \
        URL='https://github.com/thaibault/documentationWebsite' \
        SOURCE_URL='https://github.com/thaibault/documentationWebsite' \
        RENDERED_MARKDOWN="$(printDummyDocumentationContent)" \
    1>"$(sed --regexp-extended 's/^(.+)\.[^\.]+$/\1/g' <<< \
        "$render_file_path")"
done
