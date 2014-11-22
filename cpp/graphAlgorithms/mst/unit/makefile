SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../../include
LDIR := ../../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/List.h \
	 ${IDIR}/LlheapSet.h ${IDIR}/Partition.h 
XFILES = testMst timeMst checkMst

${OFILES} : ${HFILES}
${LIBGA} : ${OFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${XFILES}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

testMst: testMst.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

timeMst: timeMst.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

checkMst: checkMst.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean:
	rm -f *.o ${XFILES}
