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
<h1 id="inhalt">Inhalt</h1>
<div class="toc">
    <ul>
        <li><a href="#inhalt">Inhalt</a></li>
        <li><a href="#einstieg">Einstieg</a></li>
            <ul>
                <li><a href="#a">a</a></li>
                <li><a href="#b">b</a></li>
            </ul>
        </li>
        <li><a href="#c">c</a>
        <ul>
            <li><a href="#d">d</a>
                <ul>
                    <li><a href="#e">e</a></li>
                </ul>
            </li>
        </ul>
    </ul>
</div>
<h1 id="einstieg">Einstieg</h1>
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
<table class="codehilitetable">
    <tbody>
        <tr>
            <td class="linenos">
                <div class="linenodiv">
                    <pre> 1
 2
 3
 4
 5
 6</pre>
                </div>
            </td>
            <td class="code">
                <div class="codehilite">
                    <pre><span class="err">#</span><span class="o">!</span><span class="err">/usr/bin/env javaScript</span>

<span class="kd">var</span> <span class="nx">tools</span> <span class="o">=</span> <span class="nx">jQuery</span><span class="p">.</span><span class="nx">Tools</span><span class="p">({</span><span class="s1">&#39;logging&#39;</span><span class="o">:</span> <span class="kc">true</span><span class="p">});</span>
<span class="c1">// An 80 chars comment: mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm</span>
<span class="c1">// A 120 chars comment: mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm</span>
<span class="nx">tools</span><span class="p">.</span><span class="nx">log</span><span class="p">(</span><span class="s1">&#39;test&#39;</span><span class="p">);</span>
</pre></div></td></tr></table><p>Use as extension for object orientated jquery plugin using inheritance and<br/>dom node reference. This plugin pattern gives their instance back.</p><table class=codehilitetable><tr><td class=linenos><div class=linenodiv></pre>
                </div>
            </td>
        </tr>
    </tbody>
</table>
<h3 id="e">e</h2>
<p>
    Lorem ipsum dolor sit amet...
</p>
EOF
    }

template --log-level info index.tpl --scope-variables \
    tagline=tagline name=productName google_traking_code=google_traking_code \
    rendered_markdown="$(printDummyDocumentationContent)" \
1>index.html
